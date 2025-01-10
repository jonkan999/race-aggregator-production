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
    const allowedOrigins = ['http://127.0.0.1:8080', 'https://aggregatory-running-dashboard.web.app', 'https://loppkartan-dev.web.app', 'https://loppkartan-dev.firebaseapp.com', 'https://loppkartan-se.web.app', 'https://loppkartan-se.firebaseapp.com', 'https://loppkartan.se', 'https://www.loppkartan.se', 'https://lopskalender-dev.web.app', 'https://lopskalender-dev.firebaseapp.com', 'https://lopskalender-com.web.app', 'https://lopskalender-com.firebaseapp.com', 'https://lopskalender.com', 'https://www.lopskalender.com', 'https://juoksen-dev.web.app', 'https://juoksen-dev.firebaseapp.com', 'https://juoksen-fi.web.app', 'https://juoksen-fi.firebaseapp.com', 'https://juoksen.fi', 'https://www.juoksen.fi', 'https://lobskalender-dev.web.app', 'https://lobskalender-dev.firebaseapp.com', 'https://lobskalender-dk.web.app', 'https://lobskalender-dk.firebaseapp.com', 'https://lobskalender.dk', 'https://www.lobskalender.dk', 'https://laufrennen-dev.web.app', 'https://laufrennen-dev.firebaseapp.com', 'https://laufrennen-de.web.app', 'https://laufrennen-de.firebaseapp.com', 'https://laufrennen.de', 'https://www.laufrennen.de', 'https://hardlooplijst-dev.web.app', 'https://hardlooplijst-dev.firebaseapp.com', 'https://hardlooplijst-nl.web.app', 'https://hardlooplijst-nl.firebaseapp.com', 'https://hardlooplijst.nl', 'https://www.hardlooplijst.nl', 'https://hardlooplijst-dev.web.app', 'https://hardlooplijst-dev.firebaseapp.com', 'https://hardlooplijst-be.web.app', 'https://hardlooplijst-be.firebaseapp.com', 'https://hardlooplijst.be', 'https://www.hardlooplijst.be', 'https://jooksma-dev.web.app', 'https://jooksma-dev.firebaseapp.com', 'https://jooksma-ee.web.app', 'https://jooksma-ee.firebaseapp.com', 'https://jooksma.ee', 'https://www.jooksma.ee'];
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
