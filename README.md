# HealthyLife – Smart Health & Well-Being Awareness System

A student sustainability project for the **1M1B initiative**, aligned with **UN SDG 3: Good Health and Well-Being** under the theme *"Technology for social impact and sustainability"*.

> **⚠ Important:** HealthyLife is a **wellness awareness tool**. It does **not** provide medical advice, diagnosis, or treatment. A disclaimer is shown on every page. Always consult a qualified healthcare professional.

---

## Features

1. **Dashboard** – personal wellness overview with stat cards + 7-day charts (water, sleep, activity, mood).
2. **Water-intake tracker** – log glasses, set a daily goal, see a progress bar, and get optional browser-notification reminders.
3. **Sleep-health tracker** – log sleep hours, get a simple sleep-quality score, and read sleep-hygiene tips.
4. **Physical-activity tracker** – log steps / workout minutes with a weekly chart.
5. **Mental well-being check-in** – a friendly daily mood selector plus a guided 4-4-4-4 box-breathing break timer.
6. **Healthy lifestyle suggestions** – a filterable awareness library of food, hydration, screen-time and posture tips.
7. **Health-awareness library** – short, simple articles (nutrition, hygiene, sleep hygiene, stress management).
8. **AI wellness assistant** – a floating chat widget answering general wellness questions via the Google Gemini API, with a strict "awareness only, always consult a professional" system prompt.
9. **AI daily recommendation** – one personalized wellness suggestion per day, generated from your last 7 days of logged data.
10. **Risk-awareness flags** – purely informational nudges (e.g. consistently short sleep, low water intake), framed as awareness, never a diagnosis.

All user data is stored **only in the browser's `localStorage`** — there is no login and no server-side database.

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | HTML5, CSS3, vanilla JavaScript (single-page app, mobile-first, responsive) |
| Charts     | Chart.js 4 (via CDN) |
| Backend    | Node.js + Express (exists **only** to keep the Gemini API key on the server) |
| AI         | Google Gemini API (`gemini-2.0-flash` by default), called via REST `generateContent` |
| Storage    | Browser `localStorage` |

---

## Project structure

```
healthylife/
├── package.json
├── .env.example          # template for your Gemini API key
├── .gitignore
├── README.md
├── server/
│   └── server.js          # Express server + two Gemini endpoints
└── public/
    ├── index.html         # single-page app shell
    ├── css/
    │   └── style.css       # green/teal SDG 3 theme
    └── js/
        ├── data.js         # tips + articles content
        ├── storage.js      # localStorage + date helpers
        ├── charts.js       # Chart.js builders
        ├── ai.js           # chat widget + daily recommendation
        └── app.js          # trackers, breathing timer, flags, routing
```

---

## Setup (step by step)

### 1. Prerequisites
- **Node.js 18 or newer** (Node 20 recommended; the server uses the built-in `fetch`).

### 2. Install dependencies
```bash
cd healthylife
npm install
```

### 3. Add your Gemini API key
Copy the example env file and add your key:
```bash
cp .env.example .env
```
Then open `.env` and set:
```
GEMINI_API_KEY=your_actual_api_key_here
```
Get a free API key at **https://aistudio.google.com/app/apikey** (free-tier friendly).

### 4. Start the server
```bash
npm start
```

Open **http://localhost:3000** in your browser.

When the server starts you should see:
```
-----------------------------------------------------------
  HealthyLife – Smart Health & Well-Being Awareness System
  Running at http://localhost:3000
  Gemini model: gemini-2.0-flash
  API key loaded: yes
-----------------------------------------------------------
```

---

## About the Gemini model

The app defaults to **`gemini-2.0-flash`**. If that model name is not available on your API key, set a different one in `.env`:

```
GEMINI_MODEL=gemini-2.0-flash-lite
```

(Other commonly available names include `gemini-2.0-flash-lite`, `gemini-1.5-flash`, or `gemini-1.5-flash-8b`. Check the [Gemini API model list](https://ai.google.dev/gemini-api/docs/models) for the current names.)

If the key is missing or invalid, the chat widget and the daily recommendation show a friendly error message instead of crashing — the rest of the app (trackers, charts, library) keeps working fully offline.

---

## API endpoints (server)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/chat` | Body: `{ message, history }` → `{ reply }`. Enforces the awareness-only system prompt. |
| `POST` | `/api/recommendation` | Body: `{ summary }` (last 7 days) → `{ suggestion }`. One personalized tip per day. |

The Gemini key is **never** sent to the browser — the frontend calls these endpoints, and the server calls Gemini.

---

## Accessibility & privacy

- Mobile-first, responsive layout.
- Keyboard-navigable, visible focus styles, ARIA labels on interactive controls and charts.
- High-contrast green/teal palette with sufficient color contrast.
- **No login. No server-side data storage. No tracking.** Everything stays in your browser; the "Clear all my data" button wipes it instantly.
- The disclaimer is shown in a banner at the top of every page and again in the footer and the chat widget.

---

## Development

For auto-restart on file changes (Node 18.11+):
```bash
npm run dev
```

---

## License

MIT — free to use and adapt for educational and community-wellness purposes.

**Built for the 1M1B initiative · UN Sustainable Development Goal 3: Good Health and Well-Being 🌿**
