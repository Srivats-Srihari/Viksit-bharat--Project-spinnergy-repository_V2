/**
 * Spinnergy server
 * - Proxies Nutritionix calls (server keeps the API key secret)
 * - Provides a /simulate endpoint for generating energy points (for judges)
 *
 * Env vars:
 * - NUTRITIONIX_APP_ID
 * - NUTRITIONIX_APP_KEY
 *
 * Run: node index.js
 */
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.json({ status: 'Spinnergy server running' });
});

// Proxy endpoint: POST /api/nutrition { query: "2 idli" }
app.post('/api/nutrition', async (req, res) => {
  const Q = req.body && req.body.query;
  if (!Q) return res.status(400).json({ error: 'query required' });

  const APP_ID = process.env.NUTRITIONIX_APP_ID || '';
  const APP_KEY = process.env.NUTRITIONIX_APP_KEY || '';

  if (!APP_ID || !APP_KEY) {
    return res.status(500).json({ error: 'Nutritionix credentials not configured on server.' });
  }

  try {
    const response = await axios.post('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      query: Q
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': APP_ID,
        'x-app-key': APP_KEY
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error('Nutritionix error', err?.response?.data || err.message);
    res.status(500).json({ error: 'Nutritionix API error', detail: err?.response?.data || err.message });
  }
});

// Simulate endpoint: returns random energy increments (for judges)
app.get('/api/simulate', (req, res) => {
  // generate a random energy reading (Joules)
  const value = Number((Math.random() * 2 + 0.2).toFixed(2)); // 0.2 - 2.2 J
  res.json({ energy: value, ts: Date.now() });
});

app.listen(PORT, () => {
  console.log('Spinnergy server listening on', PORT);
});