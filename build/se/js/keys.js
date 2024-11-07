// Check if we're in development (using live-server)
const isDevelopment =
  window.location.port === '8080' || window.location.hostname === 'localhost';

// Create a promise that resolves when the key is loaded
export const keyLoaded = new Promise((resolve, reject) => {
  if (isDevelopment) {
    // For local development, import from keys_local.js
    import('./keys_local.js')
      .then((localKeys) => resolve(localKeys.MAPBOX_API_KEY))
      .catch((error) => {
        console.error('Error loading local keys:', error);
        reject(error);
      });
  } else {
    // In production, use Netlify function
    fetch('/.netlify/functions/get-api-keys')
      .then((response) => response.json())
      .then((keys) => resolve(keys.MAPBOX_API_KEY))
      .catch((error) => {
        console.error('Error loading production keys:', error);
        reject(error);
      });
  }
});