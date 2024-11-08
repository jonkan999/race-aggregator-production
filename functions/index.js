const { onRequest } = require("firebase-functions/v2/https");

exports.getApiKeys = onRequest({ 
  region: 'europe-west3', 
  secrets: ["MAPBOX_API_KEY","FIREBASE_API_KEY"] 
}, (request, response) => {
  try {
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

    response.set('Cache-Control', 'no-store');
    
    response.json({
      MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    });
  } catch (error) {
    console.error('Function error:', error);
    response.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
