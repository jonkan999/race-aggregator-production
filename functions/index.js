const { onRequest } = require('firebase-functions/v2/https');

exports.getApiKeys = onRequest((request, response) => {
  // Add CORS headers for specific domains
  const allowedOrigins = [
    'http://localhost:8080',
    'https://loppkartan-test.web.app',
    'https://loppkartan.se',
    'https://lopskalender-test.web.app',
  ];

  const origin = request.headers.origin;

  // Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  } else {
    response.status(403).json({ error: 'Unauthorized domain' });
    return;
  }

  response.set('Access-Control-Allow-Methods', 'GET');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  response.set('Cache-Control', 'no-store');

  // Return all configured API keys
  response.json({
    MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
    // Add more keys as needed
  });
});
