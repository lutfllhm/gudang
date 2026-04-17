const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { authenticate } = require('../middleware/auth');

// GET /api/tts?text=...
// Proxy Google Translate TTS — tidak butuh API key, gratis
router.get('/', authenticate, (req, res) => {
  const text = String(req.query.text || '').trim();
  if (!text) return res.status(400).json({ success: false, message: 'text required' });

  const encoded = encodeURIComponent(text.slice(0, 200)); // max 200 char per request
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encoded}`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0 Mobile Safari/537.36',
      'Referer': 'https://translate.google.com/',
    },
  };

  const request = https.get(url, options, (upstream) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    upstream.pipe(res);
    upstream.on('error', () => res.status(502).end());
  });

  request.on('error', () => res.status(502).json({ success: false, message: 'TTS fetch failed' }));
  request.setTimeout(10000, () => {
    request.destroy();
    res.status(504).json({ success: false, message: 'TTS timeout' });
  });
});

module.exports = router;
