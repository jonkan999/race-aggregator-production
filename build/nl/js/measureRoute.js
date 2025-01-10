import { keyLoaded } from './keys.js';

let map;
let markers = [];
let routeLine;
let coordinates = [];

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

  // Add a tile layer to the map
  L.tileLayer(
    `https://api.mapbox.com/styles/v1/jonkanx3/cleil8zxx001201o9krzob8a5/tiles/{z}/{x}/{y}?access_token=${apiKey}`,
    {
      minZoom: 5,
      maxZoom: 19,
    }
  ).addTo(map);

  // Add click handler for adding markers
  map.on('click', addMarker);

  // Initialize buttons
  document
    .getElementById('remove-last')
    .addEventListener('click', removeLastPoint);
  document.getElementById('clear-route').addEventListener('click', clearRoute);
}

function addMarker(e) {
  const marker = L.marker(e.latlng, {
    icon: L.divIcon({
      className: 'marker-measure',
      iconSize: [14, 14],
      iconAnchor: [7, 7], // Center the marker on the click point
      html: '<div class="marker-inner"></div>',
    }),
  }).addTo(map);

  markers.push(marker);
  coordinates.push([e.latlng.lat, e.latlng.lng]);

  updateRoute();
}

function updateRoute() {
  // Remove existing line if it exists
  if (routeLine) {
    map.removeLayer(routeLine);
  }

  // Only draw line if we have at least 2 points
  if (coordinates.length > 1) {
    routeLine = L.polyline(coordinates, {
      color: 'var(--color-primary)',
      weight: 3,
    }).addTo(map);

    // Calculate and display total distance
    const totalDistance = calculateDistance();
    document.getElementById(
      'total-distance'
    ).textContent = `${totalDistance.toFixed(2)} km`;
  }
}

function calculateDistance() {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = L.latLng(coordinates[i][0], coordinates[i][1]);
    const point2 = L.latLng(coordinates[i + 1][0], coordinates[i + 1][1]);
    total += point1.distanceTo(point2) / 1000; // Convert meters to kilometers
  }
  return total;
}

function removeLastPoint() {
  if (markers.length > 0) {
    const lastMarker = markers.pop();
    map.removeLayer(lastMarker);
    coordinates.pop();
    updateRoute();
  }
}

function clearRoute() {
  markers.forEach((marker) => map.removeLayer(marker));
  if (routeLine) {
    map.removeLayer(routeLine);
  }
  markers = [];
  coordinates = [];
  document.getElementById('total-distance').textContent = '0.00 km';
}