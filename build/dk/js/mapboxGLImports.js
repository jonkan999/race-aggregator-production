const mapboxURL = 'https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.js';
const cssURL = 'https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css';

// Import CSS
const linkEl = document.createElement('link');
linkEl.rel = 'stylesheet';
linkEl.href = cssURL;
document.head.appendChild(linkEl);

// Import and export mapboxgl
export const mapboxgl = await import(mapboxURL)
  .then((module) => module.default)
  .catch((error) => console.error('Error loading Mapbox GL JS:', error));