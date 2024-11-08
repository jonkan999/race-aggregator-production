import { keyLoaded } from './keys.js';

let map, marker;

document.addEventListener('DOMContentLoaded', () => {
  keyLoaded
    .then((MAPBOX_API_KEY) => {
      initializeMap(MAPBOX_API_KEY);
    })
    .catch((error) => {
      console.error('Failed to load API key:', error);
    });
});

function initializeMap(apiKey) {
  // Fetch the mapbox center and zoom from the data attributes
  const mapPlaceholder = document.getElementById('map-placeholder');
  const latitude = parseFloat(mapPlaceholder.dataset.latitude);
  const longitude = parseFloat(mapPlaceholder.dataset.longitude);
  const zoom = parseInt(mapPlaceholder.dataset.zoom);

  // Create a map centered on the specified location
  map = L.map('map-placeholder', { attributionControl: false }).setView(
    [latitude, longitude],
    zoom
  );
  window.globalMap = map;

  // Add a tile layer to the map
  L.tileLayer(
    `https://api.mapbox.com/styles/v1/jonkanx3/cleil8zxx001201o9krzob8a5/tiles/{z}/{x}/{y}?access_token=${apiKey}`,
    {
      minZoom: 5,
      maxZoom: 19,
    }
  ).addTo(map);

  // Add marker using the data attributes
  if (latitude && longitude) {
    addMarker(latitude, longitude);
  }
}

function addMarker(lat, lng) {
  const latlng = L.latLng(lat, lng);

  marker = L.marker(latlng, {
    icon: new L.DivIcon({
      className: 'marker-default',
      iconSize: [12, 12],
    }),
  }).addTo(map);

  updateCoordinates(latlng);
}

function updateCoordinates(latlng) {
  const coordinatesDisplay = document.getElementById('coordinates-display');

  if (coordinatesDisplay) {
    coordinatesDisplay.textContent = `Loppets koordinater: ${latlng.lat.toFixed(
      4
    )}, ${latlng.lng.toFixed(4)}`;
  }
}