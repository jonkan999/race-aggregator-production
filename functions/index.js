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
  
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  // Get config values
  const config = functions.config();
  
  // Log the config for debugging (remove in production)
  console.log('Config:', config);

  response.set('Cache-Control', 'no-store');
  
  // Return the API keys
  response.json({
    MAPBOX_API_KEY: config.mapbox.MAPBOX_API_KEY,
  });
});
