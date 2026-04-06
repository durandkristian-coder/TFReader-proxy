const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins (CORS libre para TFReader en Android WebView)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Proxy genérico: GET /proxy?url=https://api.comick.fun/...
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Falta el parámetro url' });

  // Solo permite estas fuentes (seguridad básica)
  const allowed = [
    'api.comick.fun',
    'meo.comick.pictures',
    'mangadex.org',
    'uploads.mangadex.org',
    'api.mangadex.org'
  ];
  const isAllowed = allowed.some(domain => url.includes(domain));
  if (!isAllowed) return res.status(403).json({ error: 'Fuente no permitida' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Android 11; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
        'Accept': 'application/json, image/*, */*',
        'Referer': 'https://comick.fun/',
      },
      timeout: 15000
    });

    // Si es imagen, pasa los bytes directo
    const contentType = response.headers.get('content-type') || 'application/json';
    if (contentType.startsWith('image/')) {
      res.setHeader('Content-Type', contentType);
      response.body.pipe(res);
      return;
    }

    const data = await response.text();
    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'TFReader Proxy activo ✓', version: '1.0' }));

app.listen(PORT, () => console.log(`Proxy corriendo en puerto ${PORT}`));
