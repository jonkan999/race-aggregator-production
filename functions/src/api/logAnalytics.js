const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const corsHandler = (request, response, allowedOrigins) => {
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  }
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return true;
  }
  return false;
};

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.logAnalytics = onRequest(
  {
    region: 'europe-west3',
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    const requestId = new Date().toISOString();

    console.log(`[${requestId}] Request received:`, {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      contentType: req.headers['content-type'],
      bodySize: req.rawBody?.length || 0,
    });

    try {
      const allowedOrigins = [
        'http://127.0.0.1:8080',
        'https://loppkartan-dev.web.app',
        'https://loppkartan-dev.firebaseapp.com',
        'https://loppkartan.se/',
        'https://lopskalender-dev.web.app',
        'https://lopskalender-dev.firebaseapp.com',
      ];

      if (corsHandler(req, res, allowedOrigins)) {
        console.log(`[${requestId}] Handled OPTIONS request`);
        return;
      }

      if (req.method === 'POST') {
        console.log(`[${requestId}] Processing POST data:`, {
          collection: req.body?.collection,
          dataKeys: req.body?.data ? Object.keys(req.body.data) : [],
          trigger: req.body?.data?.trigger,
          url: req.body?.data?.url,
        });

        const { collection, data } = req.body;

        if (!collection || !data) {
          console.error(`[${requestId}] Missing required data:`, {
            hasCollection: !!collection,
            hasData: !!data,
          });
          res.status(400).send('Missing required data');
          return;
        }

        console.log(`[${requestId}] Writing to collection:`, collection);

        const docRef = await admin
          .firestore()
          .collection(collection)
          .add({
            ...data,
            serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log(`[${requestId}] Document written with ID:`, docRef.id);
        res.status(200).send('Success');
      }
    } catch (error) {
      console.error(`[${requestId}] Analytics error:`, error);
      res.status(500).send('Error');
    }
  }
);
