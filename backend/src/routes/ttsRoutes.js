const express = require('express');
const router = express.Router();
const https = require('https');
const { authenticate } = require('../middleware/auth');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // default: "Bella" multilingual
const ELEVENLABS_MODEL   = process.env.ELEVENLABS_MODEL   || 'eleven_multilingual_v2';

/**
 * ElevenLabs TTS — suara natural/profesional
 * POST https://api.elevenlabs.io/v1/text-to-speech/:voice_id
 */
function elevenLabsTTS(text, res) {
  const body = JSON.stringify({
    text,
    model_id: ELEVENLABS_MODEL,
    voice_settings: {
      stability: 0.45,        // lebih rendah = lebih ekspresif & cepat
      similarity_boost: 0.80,
      style: 0.20,            // lebih netral untuk announcement
      use_speaker_boost: true,
      speed: 1.15,            // 1.0 = normal, 1.15 = 15% lebih cepat
    },
  });

  const options = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const request = https.request(options, (upstream) => {
    if (upstream.statusCode !== 200) {
      // Baca error body lalu fallback ke Google TTS
      let errBody = '';
      upstream.on('data', (chunk) => { errBody += chunk; });
      upstream.on('end', () => {
        console.error('[TTS] ElevenLabs error', upstream.statusCode, errBody);
        googleTTS(text, res);
      });
      return;
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    upstream.pipe(res);
    upstream.on('error', () => googleTTS(text, res));
  });

  request.on('error', () => googleTTS(text, res));
  request.setTimeout(15000, () => { request.destroy(); googleTTS(text, res); });
  request.write(body);
  request.end();
}

/**
 * Google Translate TTS — fallback gratis tanpa API key
 */
function googleTTS(text, res) {
  const encoded = encodeURIComponent(text.slice(0, 200));
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
  request.setTimeout(10000, () => { request.destroy(); res.status(504).json({ success: false, message: 'TTS timeout' }); });
}

// GET /api/tts?text=...
router.get('/', authenticate, (req, res) => {
  const text = String(req.query.text || '').trim();
  if (!text) return res.status(400).json({ success: false, message: 'text required' });

  if (ELEVENLABS_API_KEY) {
    elevenLabsTTS(text, res);
  } else {
    googleTTS(text, res);
  }
});

module.exports = router;
