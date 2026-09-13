/**
 * HealthyLife – AI features on the client side.
 * 1. Floating chat widget talking to POST /api/chat
 * 2. Daily personalized recommendation via POST /api/recommendation
 *
 * The Gemini API key never appears here — every AI call goes through
 * the Express server, which holds the key and enforces the
 * "awareness-only" system prompt.
 */

const AI = {
  /* ---------------- Chat widget ---------------- */

  open: false,
  history: [], // [{role:'user'|'assistant', text}] – sent so the model has context

  initChat() {
    const fab = document.getElementById('chat-fab');
    const panel = document.getElementById('chat-panel');
    const closeBtn = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');

    if (!fab || !panel || !form) return;

    fab.addEventListener('click', () => this.toggleChat());
    closeBtn.addEventListener('click', () => this.toggleChat(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.open) this.toggleChat(false);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const message = input.value.trim();
      if (!message) return;
      input.value = '';
      await this.sendChat(message);
    });

    this.addBotMessage(
      'Hi! I am your HealthyLife wellness assistant. Ask me about healthy habits, water, sleep, food, stress or study breaks. ' +
      'I share general awareness information only — for anything medical, please consult a qualified healthcare professional.'
    );
  },

  toggleChat(force) {
    const panel = document.getElementById('chat-panel');
    const fab = document.getElementById('chat-fab');
    this.open = typeof force === 'boolean' ? force : !this.open;
    panel.hidden = !this.open;
    fab.setAttribute('aria-expanded', String(this.open));
    if (this.open) {
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    }
  },

  addUserMessage(text) {
    const wrap = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.textContent = text;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  },

  addBotMessage(text, cls) {
    const wrap = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (cls || 'bot');
    div.textContent = text;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    return div;
  },

  showTyping() {
    const wrap = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = 'chat-typing';
    const dots = document.createElement('span');
    dots.className = 'typing-dots';
    for (let i = 0; i < 3; i++) dots.appendChild(document.createElement('span'));
    div.appendChild(dots);
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  },

  hideTyping() {
    const t = document.getElementById('chat-typing');
    if (t) t.remove();
  },

  async sendChat(message) {
    this.addUserMessage(message);
    this.showTyping();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: this.history.slice(-10) })
      });
      const data = await res.json();
      this.hideTyping();
      if (!res.ok) {
        this.addBotMessage(data.error || 'Sorry, something went wrong. Please try again.', 'error');
        return;
      }
      this.addBotMessage(data.reply);
      this.history.push({ role: 'user', text: message });
      this.history.push({ role: 'assistant', text: data.reply });
      if (this.history.length > 20) this.history = this.history.slice(-20);
    } catch {
      this.hideTyping();
      this.addBotMessage('Could not reach the server. Is it running? (npm start)', 'error');
    }
  },

  /* ---------------- Daily recommendation ---------------- */

  async loadRecommendation(force) {
    const el = document.getElementById('daily-recommendation');
    if (!el) return;

    const cached = Store.get(Store.KEYS.recommendation, null);
    if (!force && cached && cached.date === todayKey() && cached.text) {
      el.textContent = cached.text;
      return;
    }

    el.textContent = 'Loading today\u2019s suggestion\u2026';

    try {
      const res = await fetch('/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: HealthData.weekSummary() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      el.textContent = data.suggestion;
      Store.set(Store.KEYS.recommendation, { date: todayKey(), text: data.suggestion, source: 'ai' });
    } catch {
      // Graceful offline fallback: a sensible local tip, marked as offline.
      const fallback = FALLBACK_SUGGESTIONS[Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length)];
      el.textContent = fallback + ' (offline tip — the AI service was unavailable)';
      Store.set(Store.KEYS.recommendation, { date: todayKey(), text: el.textContent, source: 'fallback' });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => AI.initChat());
