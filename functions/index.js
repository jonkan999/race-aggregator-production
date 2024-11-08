const { onRequest } = require("firebase-functions/v2/https");

// Specify the region for the function
exports.getApiKeys = onRequest({ region: 'europe-west3' }, (request, response) => {
  // Add CORS headers for specific domains
  const allowedOrigins = ['http://localhost:8080', 'https://loppkartan-dev.web.app', 'https://loppkartan-dev.firebaseapp.com', 'https://loppkartan.se/', 'https://lopskalender-dev.web.app', 'https://lopskalender-dev.firebaseapp.com'];
  const origin = request.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
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
  });
});
