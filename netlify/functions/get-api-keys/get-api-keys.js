exports.handler = async function (event, context) {
  // Add security checks
  const referer = event.headers.referer || '';
  const allowedDomains = ['localhost', 'netlify.app'];

  const isAllowedDomain = allowedDomains.some((domain) =>
    referer.includes(domain)
  );

  if (!isAllowedDomain) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Unauthorized domain' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
      // Add more API keys as needed:
      // ANOTHER_API_KEY: process.env.ANOTHER_API_KEY
    }),
  };
};
