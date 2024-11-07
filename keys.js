let MAPBOX_API_KEY = null;

export async function getMapboxKey() {
  if (MAPBOX_API_KEY) return MAPBOX_API_KEY;

  // Check if we're in development (using live-server)
  const isDevelopment =
    window.location.port === '5500' || window.location.hostname === 'localhost';

  if (isDevelopment) {
    // For local development, fetch from local .env file
    const response = await fetch('/env.json');
    const data = await response.json();
    MAPBOX_API_KEY = data.MAPBOX_API_KEY;
  } else {
    // In production, use Netlify function
    const response = await fetch('/.netlify/functions/get-mapbox-key');
    const data = await response.json();
    MAPBOX_API_KEY = data.key;
  }

  return MAPBOX_API_KEY;
}
