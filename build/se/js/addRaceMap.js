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
  const tileUrl = `https://api.mapbox.com/styles/v1/jonkanx3/cleil8zxx001201o9krzob8a5/tiles/{z}/{x}/{y}?access_token=${apiKey}`;

  L.tileLayer(tileUrl, {
    minZoom: 5,
    maxZoom: 19,
  }).addTo(map);

  // Add click event listener to the map
  map.on('click', handleMapClick);

  // Check for coordinates in local storage
  const storedCoordinates = JSON.parse(localStorage.getItem('raceCoordinates'));
  if (
    storedCoordinates &&
    storedCoordinates.latitude &&
    storedCoordinates.longitude
  ) {
    addMarker(storedCoordinates.latitude, storedCoordinates.longitude);
    map.setView(
      [storedCoordinates.latitude, storedCoordinates.longitude],
      zoom
    );
  }

  // Make sure the map container is visible
  const mapContainer = document.getElementById('map-placeholder');

  // Force a specific height if not set
  if (!mapContainer.style.height) {
    mapContainer.style.height = '400px';
  }

  // Force a map invalidate size
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}

function handleMapClick(event) {
  const latlng = event.latlng;
  addMarker(latlng.lat, latlng.lng);
  storeCoordinates(latlng);
}

function addMarker(lat, lng) {
  const latlng = L.latLng(lat, lng);

  if (marker) {
    marker.setLatLng(latlng);
  } else {
    marker = L.marker(latlng, {
      icon: new L.DivIcon({
        className: 'marker-default',
        iconSize: [12, 12],
      }),
    }).addTo(map);
  }

  updateCoordinates(latlng);
}

function updateCoordinates(latlng) {
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const coordinatesDisplay = document.getElementById('coordinates-display');

  if (latitudeInput && longitudeInput) {
    latitudeInput.value = latlng.lat;
    longitudeInput.value = latlng.lng;
  }

  if (coordinatesDisplay) {
    coordinatesDisplay.textContent = `Loppets koordinater: ${latlng.lat.toFixed(
      4
    )}, ${latlng.lng.toFixed(4)}`;
  }
}

function storeCoordinates(latlng) {
  const coordinates = {
    latitude: latlng.lat,
    longitude: latlng.lng,
  };
  localStorage.setItem('raceCoordinates', JSON.stringify(coordinates));
}