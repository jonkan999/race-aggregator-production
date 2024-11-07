const response = await fetch('/.netlify/functions/get-api-keys');
const keys = await response.json();
export const MAPBOX_API_KEY = keys.MAPBOX_API_KEY;
