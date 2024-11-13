const { onRequest } = require('firebase-functions/v2/https');
const fetch = require('node-fetch');

const corsHandler = (request, response, allowedOrigins) => {
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  }
  response.set('Access-Control-Allow-Methods', 'GET');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return true;
  }
  return false;
};

exports.getLocation = onRequest(
  {
    region: 'europe-west3',
  },
  async (request, response) => {
    try {
      const allowedOrigins = [
        'http://127.0.0.1:8080',
        'https://loppkartan-dev.web.app',
        'https://loppkartan-dev.firebaseapp.com',
        'https://loppkartan.se/',
        'https://lopskalender-dev.web.app',
        'https://lopskalender-dev.firebaseapp.com',
      ];
      if (corsHandler(request, response, allowedOrigins)) return;

      const ip =
        request.headers['x-forwarded-for'] || request.connection.remoteAddress;
      const geoResponse = await fetch(`https://ip-api.com/json/${ip}`);
      const locationData = await geoResponse.json();

      response.json({
        country: locationData.country,
        city: locationData.city,
      });
    } catch (error) {
      console.error('Location error:', error);
      response
        .status(500)
        .json({ error: 'Location lookup failed', message: error.message });
    }
  }
);
