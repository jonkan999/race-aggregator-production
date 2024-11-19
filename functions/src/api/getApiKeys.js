const { onRequest } = require("firebase-functions/v2/https");

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

exports.getApiKeys = onRequest({ 
  region: 'europe-west3', 
  secrets: ["MAPBOX_API_KEY","FIREBASE_API_KEY"] 
}, (request, response) => {
  try {
    const allowedOrigins = ['http://127.0.0.1:8080', 'https://loppkartan-dev.web.app', 'https://loppkartan-dev.firebaseapp.com', 'https://loppkartan-se.web.app', 'https://loppkartan-se.firebaseapp.com', 'https://loppkartan.se/', 'https://lopskalender-dev.web.app', 'https://lopskalender-dev.firebaseapp.com', 'https://lopskalender-com.web.app', 'https://lopskalender-com.firebaseapp.com', 'https://lopskalender.com/'];
    if (corsHandler(request, response, allowedOrigins)) return;

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
