/**
 * HealthyLife – Smart Health & Well-Being Awareness System
 * Express server.
 *
 * The ONLY job of this backend is to keep the Gemini API key on the
 * server (never exposed to the browser) and to enforce the
 * "awareness-only, never medical advice" system prompt.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ------------------------------------------------------------------ */
/* Safety rails: system prompts that keep every AI answer              */
/* awareness-level and non-clinical.                                   */
/* ------------------------------------------------------------------ */

const CHAT_SYSTEM_PROMPT = `You are the HealthyLife wellness assistant, part of a student
sustainability project (1M1B, UN SDG 3: Good Health and Well-Being).
Your users are students and local community members.

STRICT RULES — you must always follow these:
1. You provide GENERAL WELLNESS AWARENESS INFORMATION only: healthy habits,
   hydration, sleep hygiene, physical activity, nutrition basics, stress
   management and well-being tips. You use simple, friendly, encouraging language.
2. You NEVER provide a medical diagnosis, treatment, prescription, dosage,
   or interpretation of symptoms or medical reports.
3. If a question is medical, urgent, personal-health related, or you are
   unsure — you gently decline the specifics, share at most very general
   awareness information, and tell the user to consult a qualified
   healthcare professional.
4. Always end any answer that touches on health, the body, or how the user
   feels with a short reminder like: "This is general awareness information —
   for anything medical, please consult a qualified healthcare professional."
5. If a user mentions self-harm or crisis, respond with warmth, encourage
   them to talk to someone they trust, and point them to local emergency
   services or a helpline. Do not attempt counselling.
6. Keep answers SHORT (3-6 sentences), warm, and easy to read. Plain text only.
`;

const RECOMMENDATION_SYSTEM_PROMPT = `You create ONE short, personalized daily wellness suggestion
for the HealthyLife app (a wellness awareness tool, not a medical system).
You receive a JSON summary of the user's last 7 days of self-logged habits
(water glasses, sleep hours, activity, mood).

Rules:
- Return exactly ONE suggestion, 1-2 sentences, warm and encouraging.
- Reference the user's actual data (e.g. low sleep, low water) when relevant.
- Awareness-level only: never diagnose, never give medical advice, never alarm.
- Plain text only, no markdown, no lists, no emojis.
`;

/* ------------------------------------------------------------------ */
/* Gemini helper (REST endpoint, Node 18+ global fetch)                 */
/* ------------------------------------------------------------------ */

async function callGemini(systemPrompt, contents) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(`Gemini API responded ${response.status}. ${detail.slice(0, 300)}`);
    error.status = response.status === 400 || response.status === 403 ? 401 : 502;
    throw error;
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim();
  return text;
}

/* ------------------------------------------------------------------ */
/* API: AI wellness chat                                                */
/* ------------------------------------------------------------------ */

app.post('/api/chat', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(503).json({
        error: 'Server is missing GEMINI_API_KEY. Add it to your .env file and restart.',
      });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A non-empty "message" field is required.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters).' });
    }

    // Optional short history from the client: [{role: 'user'|'assistant', text}]
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-10) : [];
    const contents = history
      .filter((turn) => turn && typeof turn.text === 'string' && turn.text.trim())
      .map((turn) => ({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.text.slice(0, 2000) }],
      }));
    contents.push({ role: 'user', parts: [{ text: message.trim() }] });

    const reply = await callGemini(CHAT_SYSTEM_PROMPT, contents);
    if (!reply) {
      return res.status(502).json({ error: 'The AI returned an empty answer. Please try again.' });
    }
    return res.json({ reply });
  } catch (err) {
    console.error('[/api/chat]', err.message);
    return res.status(err.status || 500).json({ error: 'Could not reach the AI service. Please try again in a moment.' });
  }
});

/* ------------------------------------------------------------------ */
/* API: daily personalized recommendation                               */
/* ------------------------------------------------------------------ */

app.post('/api/recommendation', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(503).json({
        error: 'Server is missing GEMINI_API_KEY. Add it to your .env file and restart.',
      });
    }

    const { summary } = req.body || {};
    if (!summary || typeof summary !== 'object') {
      return res.status(400).json({ error: 'A "summary" object is required.' });
    }

    const userPrompt = `Here is the user's self-logged wellness data for the last 7 days
(as JSON; missing or null values mean the user did not log that day):

${JSON.stringify(summary, null, 2)}

Generate today's single personalized wellness suggestion now.`;

    const suggestion = await callGemini(RECOMMENDATION_SYSTEM_PROMPT, [
      { role: 'user', parts: [{ text: userPrompt }] },
    ]);

    if (!suggestion) {
      return res.status(502).json({ error: 'The AI returned an empty suggestion.' });
    }
    return res.json({ suggestion });
  } catch (err) {
    console.error('[/api/recommendation]', err.message);
    return res.status(err.status || 500).json({ error: 'Could not generate a suggestion right now.' });
  }
});

/* ------------------------------------------------------------------ */
/* Start                                                                */
/* ------------------------------------------------------------------ */

app.listen(PORT, () => {
  console.log('-----------------------------------------------------------');
  console.log('  HealthyLife – Smart Health & Well-Being Awareness System');
  console.log(`  Running at http://localhost:${PORT}`);
  console.log(`  Gemini model: ${MODEL}`);
  console.log(`  API key loaded: ${API_KEY ? 'yes' : 'NO — create a .env file (see .env.example)'}`);
  console.log('-----------------------------------------------------------');
});
