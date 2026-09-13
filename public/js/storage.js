/**
 * HealthyLife – localStorage helpers.
 * All user data stays in the browser (no login, no server storage).
 */

const Store = {
  KEYS: {
    water: 'hl_water',           // { 'YYYY-MM-DD': glasses }
    sleep: 'hl_sleep',           // { 'YYYY-MM-DD': { hours, feeling } }
    activity: 'hl_activity',      // { 'YYYY-MM-DD': { steps, minutes } }
    mood: 'hl_mood',              // { 'YYYY-MM-DD': 'great'|'good'|'okay'|'low'|'rough' }
    goals: 'hl_goals',            // { water, sleep, steps, minutes }
    recommendation: 'hl_recommendation', // { date, text, source }
    prefs: 'hl_prefs'            // { waterReminders: true|false }
  },

  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn('HealthyLife: could not save to localStorage.');
    }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },

  clearAll() {
    Object.values(this.KEYS).forEach((k) => this.remove(k));
  }
};

const DEFAULT_GOALS = { water: 8, sleep: 8, steps: 8000, minutes: 30 };

const MOODS = {
  great:    { label: 'Great',    emoji: '😄', score: 5 },
  good:     { label: 'Good',     emoji: '🙂', score: 4 },
  okay:     { label: 'Okay',     emoji: '😐', score: 3 },
  low:      { label: 'Low',      emoji: '🙁', score: 2 },
  rough:    { label: 'Rough',    emoji: '😔', score: 1 }
};

/* ---------- Date helpers (keys are local dates 'YYYY-MM-DD') ---------- */

function dateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey() { return dateKey(new Date()); }

/** Returns an array of the last n date-keys, oldest first, ending today. */
function lastNDays(n) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

/** '2026-09-12' -> 'Sat 12 Sep' */
function prettyDate(key) {
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Short weekday label for chart axes. */
function weekdayShort(key) {
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function goals() {
  return Object.assign({}, DEFAULT_GOALS, Store.get(Store.KEYS.goals, {}));
}

/* ---------- Data accessors ---------- */

const HealthData = {
  getWater(key) { return Store.get(Store.KEYS.water, {})[key] || 0; },
  getSleep(key) { return Store.get(Store.KEYS.sleep, {})[key] || null; },
  getActivity(key) { return Store.get(Store.KEYS.activity, {})[key] || null; },
  getMood(key) { return Store.get(Store.KEYS.mood, {})[key] || null; },

  setWater(key, glasses) {
    const all = Store.get(Store.KEYS.water, {});
    all[key] = Math.max(0, Math.min(50, Math.round(glasses)));
    Store.set(Store.KEYS.water, all);
  },

  setSleep(key, entry) {
    const all = Store.get(Store.KEYS.sleep, {});
    all[key] = entry;
    Store.set(Store.KEYS.sleep, all);
  },

  setActivity(key, entry) {
    const all = Store.get(Store.KEYS.activity, {});
    all[key] = entry;
    Store.set(Store.KEYS.activity, all);
  },

  setMood(key, mood) {
    const all = Store.get(Store.KEYS.mood, {});
    all[key] = mood;
    Store.set(Store.KEYS.mood, all);
  },

  /** Series helpers (oldest -> today, nulls when not logged). */
  waterSeries(days) { return lastNDays(days).map((k) => this.getWater(k)); },
  sleepSeries(days) { return lastNDays(days).map((k) => this.getSleep(k)?.hours ?? null); },
  activitySeries(days) { return lastNDays(days).map((k) => this.getActivity(k)?.minutes ?? 0); },
  moodSeries(days) {
    return lastNDays(days).map((k) => {
      const m = this.getMood(k);
      return m ? MOODS[m].score : null;
    });
  },

  /** Compact summary of the last 7 days, sent to the AI for the daily suggestion. */
  weekSummary() {
    const keys = lastNDays(7);
    return {
      days: keys.map((k) => ({
        date: k,
        waterGlasses: this.getWater(k) || null,
        sleepHours: this.getSleep(k) ? this.getSleep(k).hours : null,
        activityMinutes: this.getActivity(k) ? this.getActivity(k).minutes : null,
        mood: this.getMood(k) || null
      })),
      goals: goals()
    };
  }
};
