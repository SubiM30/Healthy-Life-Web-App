/**
 * HealthyLife – main application logic.
 * Handles navigation, the four trackers, the breathing timer,
 * risk-awareness flags, and the lifestyle/awareness library.
 */

const App = {
  /* ---------------- Page navigation ---------------- */

  navigate(page) {
    document.querySelectorAll('.page').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link').forEach((b) => {
      const active = b.dataset.page === page;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh the charts of the page we just entered.
    if (page === 'dashboard') Charts.refreshDashboard();
    if (page === 'activity') Charts.activityWeek();
  },

  initNav() {
    document.querySelectorAll('.nav-link').forEach((btn) => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.page));
    });
  },

  /* ---------------- Helpers ---------------- */

  setProgress(id, value, max) {
    const bar = document.getElementById(id);
    if (!bar) return;
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const fill = bar.querySelector('.progress-fill');
    if (fill) fill.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(pct));
  },

  flash(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => { el.textContent = ''; }, 3000);
  },

  /* ---------------- Dashboard ---------------- */

  renderDashboard() {
    const g = goals();
    const waterToday = HealthData.getWater(todayKey());
    const sleepLast = HealthData.getSleep(lastNDays(2)[0]); // last logged night
    const activityToday = HealthData.getActivity(todayKey());
    const moodToday = HealthData.getMood(todayKey());

    // Water stat
    document.getElementById('stat-water').textContent = waterToday;
    document.getElementById('stat-water-goal').textContent = g.water;
    this.setProgress('stat-water-bar', waterToday, g.water);

    // Sleep stat
    const sleepHours = sleepLast ? sleepLast.hours : 0;
    document.getElementById('stat-sleep').textContent = sleepLast ? sleepHours : '–';
    this.setProgress('stat-sleep-bar', sleepHours, g.sleep);

    // Activity stat
    const actMin = activityToday ? (activityToday.minutes || 0) : 0;
    document.getElementById('stat-activity').textContent = actMin;
    this.setProgress('stat-activity-bar', actMin, g.minutes);

    // Mood stat
    const moodEl = document.getElementById('stat-mood');
    moodEl.textContent = moodToday ? `${MOODS[moodToday].emoji} ${MOODS[moodToday].label}` : 'Not checked in';

    Charts.refreshDashboard();
    this.renderFlags();
  },

  /* ---------------- Risk-awareness flags (informational only) ---------------- */

  renderFlags() {
    const container = document.getElementById('flags-container');
    if (!container) return;
    container.innerHTML = '';
    const flags = [];

    // Sleep: <5h for the last 3 logged nights
    const sleepKeys = lastNDays(7);
    const recentSleep = sleepKeys.map((k) => HealthData.getSleep(k)).filter(Boolean).slice(-3);
    if (recentSleep.length >= 3 && recentSleep.every((s) => s.hours < 5)) {
      flags.push('😴 Consistent short sleep can affect your health — consider winding down earlier and aiming for 7–9 hours. (Awareness only, not a diagnosis.)');
    }

    // Water: average under 3 glasses over last 3 days
    const recentWater = lastNDays(3).map((k) => HealthData.getWater(k));
    const avgWater = recentWater.reduce((a, b) => a + b, 0) / 3;
    if (avgWater < 3) {
      flags.push('💧 You have been drinking very little water. Try keeping a bottle nearby today.');
    }

    // Activity: 0 workout minutes logged for last 3 days
    const recentAct = lastNDays(3).map((k) => HealthData.getActivity(k));
    if (recentAct.every((a) => !a || (a.minutes || 0) === 0)) {
      flags.push('🏃 Movement has been low — even a 10-minute walk or stretch counts today.');
    }

    // Mood: low/rough for 3 consecutive days
    const recentMoods = lastNDays(3).map((k) => HealthData.getMood(k));
    if (recentMoods.every((m) => m === 'low' || m === 'rough')) {
      flags.push('💚 You have felt low for a few days. Talking to someone you trust — a friend, family member, teacher or counsellor — can really help. If it continues, a healthcare professional is a good step.');
    }

    if (flags.length === 0) {
      flags.push('✅ Keep logging your habits to see personalized awareness notes here.');
      container.insertAdjacentHTML('beforeend', `<div class="flag positive">${flags[0]}</div>`);
    } else {
      flags.forEach((f) => container.insertAdjacentHTML('beforeend', `<div class="flag">${f}</div>`));
    }
  },

  /* ---------------- Water tracker ---------------- */

  initWater() {
    const update = () => {
      const g = goals();
      const count = HealthData.getWater(todayKey());
      document.getElementById('water-count').textContent = count;
      document.getElementById('water-goal-display').textContent = g.water;
      this.setProgress('water-progress', count, g.water);
      document.getElementById('water-goal-input').value = g.water;
      this.renderGlassesStrip(count, g.water);
      this.renderWaterHistory();
      this.renderDashboard(); // keep the dashboard card in sync
    };

    document.getElementById('water-add').addEventListener('click', () => this.adjustWater(1));
    document.getElementById('water-remove').addEventListener('click', () => this.adjustWater(-1));

    document.getElementById('water-goal-save').addEventListener('click', () => {
      const val = parseInt(document.getElementById('water-goal-input').value, 10);
      if (val >= 1 && val <= 20) {
        const g = goals();
        g.water = val;
        Store.set(Store.KEYS.goals, g);
        update();
      }
    });

    update();
    this.initWaterReminders();
  },

  adjustWater(delta) {
    const today = todayKey();
    const current = HealthData.getWater(today);
    HealthData.setWater(today, current + delta);
    const g = goals();
    document.getElementById('water-count').textContent = HealthData.getWater(today);
    this.setProgress('water-progress', HealthData.getWater(today), g.water);
    this.renderGlassesStrip(HealthData.getWater(today), g.water);
    this.renderWaterHistory();
    this.renderDashboard();
    if (delta > 0 && HealthData.getWater(today) >= g.water) {
      this.flash('water-reminder-status', `Great — you reached your water goal for today! 💧`);
    }
  },

  setWaterDirectly(glasses) {
    HealthData.setWater(todayKey(), glasses);
    const g = goals();
    document.getElementById('water-count').textContent = glasses;
    this.setProgress('water-progress', glasses, g.water);
    this.renderGlassesStrip(glasses, g.water);
    this.renderWaterHistory();
    this.renderDashboard();
  },

  renderGlassesStrip(count, max) {
    const strip = document.getElementById('water-glasses-strip');
    if (!strip) return;
    strip.innerHTML = '';
    const shown = Math.max(max, 8);
    for (let i = 1; i <= shown; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glass-btn' + (i <= count ? ' full' : '');
      btn.textContent = '💧';
      btn.setAttribute('aria-label', `${i} glass${i > 1 ? 'es' : ''}`);
      btn.addEventListener('click', () => this.setWaterDirectly(i));
      strip.appendChild(btn);
    }
  },

  renderWaterHistory() {
    const ul = document.getElementById('water-history');
    if (!ul) return;
    ul.innerHTML = '';
    lastNDays(7).slice().reverse().forEach((k) => {
      const count = HealthData.getWater(k);
      const li = document.createElement('li');
      li.innerHTML = `<span>${prettyDate(k)}</span><strong>${count} glass${count !== 1 ? 'es' : ''}</strong>`;
      ul.appendChild(li);
    });
  },

  /* ---------------- Water reminder notifications ---------------- */

  reminderTimer: null,

  initWaterReminders() {
    const toggle = document.getElementById('water-reminders-toggle');
    const status = document.getElementById('water-reminder-status');
    if (!toggle) return;

    const prefs = Store.get(Store.KEYS.prefs, {});
    toggle.checked = !!prefs.waterReminders;
    this.syncReminderState();

    toggle.addEventListener('change', async () => {
      const prefs = Store.get(Store.KEYS.prefs, {});
      if (toggle.checked) {
        if (!('Notification' in window)) {
          status.textContent = 'Your browser does not support notifications.';
          toggle.checked = false;
          return;
        }
        if (Notification.permission === 'granted') {
          prefs.waterReminders = true;
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          prefs.waterReminders = perm === 'granted';
          toggle.checked = prefs.waterReminders;
        } else {
          prefs.waterReminders = false;
          toggle.checked = false;
          status.textContent = 'Notifications are blocked. Allow them in your browser settings to use reminders.';
        }
      } else {
        prefs.waterReminders = false;
      }
      Store.set(Store.KEYS.prefs, prefs);
      this.syncReminderState();
    });
  },

  syncReminderState() {
    const prefs = Store.get(Store.KEYS.prefs, {});
    const status = document.getElementById('water-reminder-status');
    if (this.reminderTimer) { clearInterval(this.reminderTimer); this.reminderTimer = null; }
    if (prefs.waterReminders && Notification.permission === 'granted') {
      status.textContent = 'Reminders are on. You will get a nudge every 60 minutes while this tab stays open.';
      this.reminderTimer = setInterval(() => {
        const count = HealthData.getWater(todayKey());
        if (count < goals().water) {
          new Notification('HealthyLife · Water reminder', {
            body: `Time for a glass of water? You are at ${count}/${goals().water} glasses today. 💧`
          });
        }
      }, 60 * 60 * 1000);
    } else if (status) {
      status.textContent = 'Reminders are off.';
    }
  },

  /* ---------------- Sleep tracker ---------------- */

  initSleep() {
    const dateInput = document.getElementById('sleep-date');
    dateInput.value = todayKey();
    dateInput.max = todayKey();

    document.getElementById('sleep-save').addEventListener('click', () => {
      const date = dateInput.value || todayKey();
      const hours = parseFloat(document.getElementById('sleep-hours').value);
      const feelingEl = document.querySelector('input[name="sleep-feeling"]:checked');
      const feeling = feelingEl ? feelingEl.value : null;
      if (isNaN(hours) || hours < 0 || hours > 24) {
        this.flash('sleep-saved-msg', 'Please enter a valid number of hours (0–24).');
        return;
      }
      HealthData.setSleep(date, { hours, feeling });
      this.flash('sleep-saved-msg', 'Saved. 💤');
      this.renderSleepScore();
      this.renderSleepHistory();
      this.renderDashboard();
    });

    this.renderSleepScore();
    this.renderSleepHistory();
  },

  sleepScore(hours) {
    // Simple awareness score: 7-9h great, 6h okay, below or above drops off.
    if (hours == null) return null;
    let score;
    if (hours >= 7 && hours <= 9) score = 90 + (hours - 7) * 3;
    else if (hours >= 6 && hours < 7) score = 70 + (hours - 6) * 18;
    else if (hours >= 5 && hours < 6) score = 50 + (hours - 5) * 15;
    else if (hours >= 9 && hours <= 10) score = 85 - (hours - 9) * 10;
    else if (hours < 5) score = 40;
    else score = 60;
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  renderSleepScore() {
    const last = HealthData.getSleep(lastNDays(7).find((k) => HealthData.getSleep(k)) || todayKey());
    const scoreEl = document.getElementById('sleep-score');
    const labelEl = document.getElementById('sleep-score-label');
    if (!last) {
      scoreEl.textContent = '–';
      this.setProgress('sleep-score-bar', 0, 100);
      labelEl.textContent = 'Log a night to see your score.';
      return;
    }
    const score = this.sleepScore(last.hours);
    scoreEl.textContent = score;
    this.setProgress('sleep-score-bar', score, 100);
    let label;
    if (score >= 85) label = 'Great sleep length — keep it up!';
    else if (score >= 70) label = 'Pretty good. A little more could help you feel sharper.';
    else if (score >= 50) label = 'A bit short — try winding down earlier tonight.';
    else label = 'Quite short — aim for 7–9 hours and a regular bedtime. (Awareness only.)';
    labelEl.textContent = label + (last.feeling ? ` You said you felt "${last.feeling}" this morning.` : '');
  },

  renderSleepHistory() {
    const ul = document.getElementById('sleep-history');
    if (!ul) return;
    ul.innerHTML = '';
    lastNDays(7).slice().reverse().forEach((k) => {
      const s = HealthData.getSleep(k);
      const li = document.createElement('li');
      li.innerHTML = `<span>${prettyDate(k)}</span><strong>${s ? s.hours + ' h' + (s.feeling ? ' · ' + s.feeling : '') : 'not logged'}</strong>`;
      ul.appendChild(li);
    });
  },

  /* ---------------- Activity tracker ---------------- */

  initActivity() {
    const dateInput = document.getElementById('activity-date');
    dateInput.value = todayKey();
    dateInput.max = todayKey();

    document.getElementById('activity-save').addEventListener('click', () => {
      const date = dateInput.value || todayKey();
      const steps = parseInt(document.getElementById('activity-steps').value, 10) || 0;
      const minutes = parseInt(document.getElementById('activity-minutes').value, 10) || 0;
      if (steps < 0 || minutes < 0) {
        this.flash('activity-saved-msg', 'Please enter non-negative values.');
        return;
      }
      // Merge with any existing entry for the day.
      const existing = HealthData.getActivity(date) || { steps: 0, minutes: 0 };
      HealthData.setActivity(date, { steps, minutes });
      this.flash('activity-saved-msg', 'Saved. 🏃');
      this.renderActivityWeek();
      this.renderActivityHistory();
      this.renderDashboard();
      Charts.activityWeek();
    });

    this.renderActivityWeek();
    this.renderActivityHistory();
  },

  renderActivityWeek() {
    const keys = lastNDays(7);
    let totalMin = 0, totalSteps = 0;
    keys.forEach((k) => {
      const a = HealthData.getActivity(k);
      if (a) { totalMin += a.minutes || 0; totalSteps += a.steps || 0; }
    });
    document.getElementById('activity-week-minutes').textContent = totalMin;
    document.getElementById('activity-week-steps').textContent = totalSteps.toLocaleString();
  },

  renderActivityHistory() {
    const ul = document.getElementById('activity-history');
    if (!ul) return;
    ul.innerHTML = '';
    lastNDays(7).slice().reverse().forEach((k) => {
      const a = HealthData.getActivity(k);
      const li = document.createElement('li');
      li.innerHTML = `<span>${prettyDate(k)}</span><strong>${a ? `${a.steps.toLocaleString()} steps · ${a.minutes} min` : 'not logged'}</strong>`;
      ul.appendChild(li);
    });
  },

  /* ---------------- Mood + breathing ---------------- */

  initMood() {
    document.querySelectorAll('.mood-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mood = btn.dataset.mood;
        HealthData.setMood(todayKey(), mood);
        this.highlightMood(mood);
        this.flash('mood-saved-msg', `Logged: ${MOODS[mood].label}. Thanks for checking in. 💚`);
        this.renderMoodHistory();
        this.renderDashboard();
      });
    });

    // Highlight today's mood if already logged.
    const todayMood = HealthData.getMood(todayKey());
    if (todayMood) this.highlightMood(todayMood);

    this.renderMoodHistory();
    this.initBreathing();
  },

  highlightMood(mood) {
    document.querySelectorAll('.mood-btn').forEach((b) => {
      b.classList.toggle('selected', b.dataset.mood === mood);
      b.setAttribute('aria-pressed', b.dataset.mood === mood ? 'true' : 'false');
    });
  },

  renderMoodHistory() {
    const ul = document.getElementById('mood-history');
    if (!ul) return;
    ul.innerHTML = '';
    lastNDays(7).slice().reverse().forEach((k) => {
      const m = HealthData.getMood(k);
      const li = document.createElement('li');
      li.innerHTML = `<span>${prettyDate(k)}</span><strong>${m ? `${MOODS[m].emoji} ${MOODS[m].label}` : 'not logged'}</strong>`;
      ul.appendChild(li);
    });
  },

  initBreathing() {
    const circle = document.getElementById('breath-circle');
    const phaseEl = document.getElementById('breath-phase');
    const countEl = document.getElementById('breath-count');
    const startBtn = document.getElementById('breath-start');
    const stopBtn = document.getElementById('breath-stop');
    if (!circle || !startBtn) return;

    let running = false;
    let timer = null;
    let cyclesLeft = 0;
    let phaseStart = 0;
    let phaseIndex = 0;

    const phases = [
      { name: 'Breathe in', duration: 4, cls: 'breathe-in' },
      { name: 'Hold', duration: 4, cls: '' },
      { name: 'Breathe out', duration: 4, cls: 'breathe-out' },
      { name: 'Hold', duration: 4, cls: '' }
    ];

    const setPhase = (i) => {
      phaseIndex = i % 4;
      const p = phases[phaseIndex];
      circle.classList.remove('breathe-in', 'breathe-out');
      if (p.cls) circle.classList.add(p.cls);
      phaseEl.textContent = p.name;
    };

    const tick = () => {
      if (!running) return;
      setPhase(phaseIndex);
      countEl.textContent = `${cyclesLeft} cycle${cyclesLeft !== 1 ? 's' : ''} to go`;
      timer = setTimeout(() => {
        if (phaseIndex === 3) {
          cyclesLeft--;
          if (cyclesLeft <= 0) {
            stop();
            phaseEl.textContent = 'Nice — well done! 🌿';
            countEl.textContent = '';
            return;
          }
        }
        setPhase(phaseIndex + 1);
        timer = setTimeout(tick, phases[(phaseIndex + 1) % 4].duration * 1000);
      }, phases[phaseIndex].duration * 1000);
    };

    const stop = () => {
      running = false;
      clearTimeout(timer);
      circle.classList.remove('breathe-in', 'breathe-out');
      if (phaseEl.textContent === '') phaseEl.textContent = 'Ready when you are';
    };

    startBtn.addEventListener('click', () => {
      if (running) return;
      running = true;
      cyclesLeft = 4; // ~64s, close to "1 minute"
      phaseIndex = 0;
      tick();
    });

    stopBtn.addEventListener('click', stop);
  },

  /* ---------------- Lifestyle tips library ---------------- */

  initTips() {
    const grid = document.getElementById('tips-grid');
    if (!grid) return;
    grid.innerHTML = '';
    LIFESTYLE_TIPS.forEach((tip) => {
      const card = document.createElement('article');
      card.className = 'tip-card';
      card.dataset.category = tip.category;
      card.innerHTML =
        `<span class="tip-tag">${tip.category}</span>` +
        `<h3>${tip.icon} ${tip.title}</h3>` +
        `<p class="muted">${tip.text}</p>`;
      grid.appendChild(card);
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        grid.querySelectorAll('.tip-card').forEach((c) => {
          c.style.display = (f === 'all' || c.dataset.category === f) ? '' : 'none';
        });
      });
    });
  },

  /* ---------------- Awareness articles library ---------------- */

  initLibrary() {
    const grid = document.getElementById('articles-grid');
    if (!grid) return;
    grid.innerHTML = '';
    AWARENESS_ARTICLES.forEach((a) => {
      const card = document.createElement('article');
      card.className = 'article-card';
      const points = a.points.map((p) => `<li>${p}</li>`).join('');
      card.innerHTML =
        `<h3>${a.icon} ${a.title}</h3>` +
        `<p class="muted">${a.summary}</p>` +
        `<details><summary>Read more</summary><ul>${points}</ul></details>`;
      grid.appendChild(card);
    });
  },

  /* ---------------- Data reset ---------------- */

  initClearData() {
    const btn = document.getElementById('clear-data');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (confirm('This will delete all HealthyLife data stored in your browser (water, sleep, activity, mood and goals). Continue?')) {
        Store.clearAll();
        location.reload();
      }
    });
  },

  /* ---------------- Boot ---------------- */

  init() {
    this.initNav();
    this.renderDashboard();
    this.initWater();
    this.initSleep();
    this.initActivity();
    this.initMood();
    this.initTips();
    this.initLibrary();
    this.initClearData();

    // Load today's AI recommendation (async, non-blocking).
    AI.loadRecommendation(false);
    document.getElementById('refresh-recommendation').addEventListener('click', () => AI.loadRecommendation(true));
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
