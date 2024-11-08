const { onRequest } = require('firebase-functions/v2/https');

exports.getApiKeys = onRequest((request, response) => {
  // Add CORS headers
  response.set('Access-Control-Allow-Origin', '*');

  // Add security checks
  const referer = request.headers.referer || '';
  const allowedDomains = ['localhost', 'firebaseapp.com', 'web.app'];

  const isAllowedDomain = allowedDomains.some((domain) =>
    referer.includes(domain)
  );

  if (!isAllowedDomain) {
    response.status(403).json({ error: 'Unauthorized domain' });
    return;
  }

  // Access environment config correctly
  const mapboxKey = process.env.MAPBOX_API_KEY;

  response.set('Cache-Control', 'no-store');
  response.json({
    MAPBOX_API_KEY: mapboxKey,
  });
});
