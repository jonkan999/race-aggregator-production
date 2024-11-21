import { keyLoaded } from './keys.js';

const MAPBOX_API_KEY = await keyLoaded;
console.log(MAPBOX_API_KEY);
mapboxgl.accessToken = MAPBOX_API_KEY;
function setMarkerSvg(marker, svgContent) {
  marker.getElement().innerHTML = svgContent;
}

const defaultMarkerSVG = `
<svg display="block" height="31px" width="27px" viewBox="0 0 27 41">
  <g fill-rule="nonzero">
    <g transform="translate(3.0, 29.0)" fill="#555">
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="10.5"
        ry="5.25002273"
      ></ellipse>
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="10.5"
        ry="5.25002273"
      ></ellipse>
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="9.5"
        ry="4.77275007"
      ></ellipse>
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="8.5"
        ry="4.29549936"
      ></ellipse>
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="7.5"
        ry="3.81822308"
      ></ellipse>
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="6.5"
        ry="3.34094679"
      ></ellipse>
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="5.5"
        ry="2.86367051"
      ></ellipse>
      <ellipse
        opacity="0.04"
        cx="10.5"
        cy="5.80029008"
        rx="4.5"
        ry="2.38636864"
      ></ellipse>
    </g>
    <g fill="var(--color-warning)">
      <path d="M27,13.5 C27,19.074644 20.250001,27.000002 14.75,34.500002 C14.016665,35.500004 12.983335,35.500004 12.25,34.500002 C6.7499993,27.000002 0,19.222562 0,13.5 C0,6.0441559 6.0441559,0 13.5,0 C20.955844,0 27,6.0441559 27,13.5 Z"></path>
    </g>
    <g opacity="0.25" fill="var(--color-success)000">
      <path d="M13.5,0 C6.0441559,0 0,6.0441559 0,13.5 C0,19.222562 6.7499993,27 12.25,34.5 C13,35.522727 14.016664,35.500004 14.75,34.5 C20.250001,27 27,19.074644 27,13.5 C27,6.0441559 20.955844,0 13.5,0 Z M13.5,1 C20.415404,1 26,6.584596 26,13.5 C26,15.898657 24.495584,19.181431 22.220703,22.738281 C19.945823,26.295132 16.705119,30.142167 13.943359,33.908203 C13.743445,34.180814 13.612715,34.322738 13.5,34.441406 C13.387285,34.322738 13.256555,34.180814 13.056641,33.908203 C10.284481,30.127985 7.4148684,26.314159 5.015625,22.773438 C2.6163816,19.232715 1,15.953538 1,13.5 C1,6.584596 6.584596,1 13.5,1 Z"></path>
    </g>
    <g transform="translate(6.0, 7.0)" fill="#FFFFFF"></g>
    <g transform="translate(8.0, 8.0)">
      <circle
        fill="var(--color-success)000"
        opacity="0.25"
        cx="5.5"
        cy="5.5"
        r="5.4999962"
      ></circle>
      <circle fill="#FFFFFF" cx="5.5" cy="5.5" r="5.4999962"></circle>
    </g>
  </g>
</svg>`;
// Access the map container element
console.log('DOMContentLoaded fired');
const mapContainer = document.getElementById('map-placeholder');

// Create a custom popup element
const customPopup = document.createElement('div');
customPopup.className = 'custom-map-popup';
customPopup.style.display = 'none';
mapContainer.appendChild(customPopup);

// Get the map container and its data attributes
const latitude = parseFloat(mapContainer.getAttribute('data-latitude'));
const longitude = parseFloat(mapContainer.getAttribute('data-longitude'));
const zoom = parseInt(mapContainer.getAttribute('data-zoom'));

// Initialize the map with the data from attributes
const map = new mapboxgl.Map({
  container: mapContainer,
  style: 'mapbox://styles/mapbox/light-v10',
  center: [longitude, latitude], // Note: Mapbox uses [longitude, latitude] order
  zoom: zoom, // Fallback to 11 if zoom attribute is not present
});

console.log('Map initialized with:', { latitude, longitude, zoom });

// Resize the map when needed
function resizeMap() {
  console.log('fire');
  map.resize();
}

// Call the resizeMap function whenever you need to resize the map
// For example, you can call it when the window resizes
const toggleButtonMobile = document.getElementById('toggleMapButtonMobile');
const toggleMapButton = document.getElementById('toggleMapButton');
if (toggleButtonMobile) {
  toggleButtonMobile.addEventListener('click', resizeMap);
}
if (toggleMapButton) {
  toggleMapButton.addEventListener('click', resizeMap);
}

map.on('load', () => {
  // Remove the Mapbox logo element
  const mapboxLogo = document.querySelector('.mapboxgl-ctrl-logo');
  if (mapboxLogo) {
    mapboxLogo.parentNode.removeChild(mapboxLogo);
  }

  // Remove the "Improve this map" link element
  const improveMapLink = document.querySelector('.mapboxgl-ctrl-attrib-inner');
  if (improveMapLink) {
    improveMapLink.parentNode.removeChild(improveMapLink);
  }
});

// Create a function to add a marker for a venue
// Create a function to add a marker for a venue
function addMarker(race, index) {
  const raceBox = raceBoxes[index];
  if (raceBox) {
    const marker = new mapboxgl.Marker()
      .setLngLat(race.mapboxCenter)
      .addTo(map);
    setMarkerSvg(marker, defaultMarkerSVG);

    const dataNameValue = raceBox.getAttribute('data-name');
    marker.getElement().setAttribute('data-name', dataNameValue);

    markers.push(marker);

    const markerElement = marker.getElement();

    raceBox.addEventListener('mouseenter', () => {
      changeMarkerColor(markerElement, 'var(--color-success)');
    });

    raceBox.addEventListener('mouseleave', () => {
      changeMarkerColor(markerElement, 'var(--color-warning)');
    });

    raceBox.addEventListener('click', () => {
      changeMarkerColor(markerElement, 'var(--color-success)');
    });
  }
}

// Collect race-card elements and extract coordinates
const markers = []; // Array to store marker references
const races = [];
const raceBoxes = document.querySelectorAll('.race-cards-grid .race-card');
raceBoxes.forEach((raceBox, index) => {
  const latitude = parseFloat(raceBox.getAttribute('data-latitude'));
  const longitude = parseFloat(raceBox.getAttribute('data-longitude'));

  if (!isNaN(latitude) && !isNaN(longitude)) {
    const coordinates = [longitude, latitude]; // Mapbox uses [lng, lat]
    races.push({ mapboxCenter: coordinates });
    // Call addMarker with the race and index
    addMarker({ mapboxCenter: coordinates }, index);
  }
});

// Create a function to handle marker click events
let isPopupOpen = false; // Initialize a flag to track popup state

function handleMarkerClick(marker) {
  event.stopPropagation();

  const coordinates = marker.getLngLat();

  const matchingRace = races.find((race) => {
    return (
      race.mapboxCenter[0] === coordinates.lng &&
      race.mapboxCenter[1] === coordinates.lat
    );
  });

  if (matchingRace) {
    const raceBox = raceBoxes[races.indexOf(matchingRace)];
    const raceLink = raceBox ? raceBox.getAttribute('href') : '';
    const imageElement = raceBox.querySelector('.background-img');
    const imageUrl = imageElement ? imageElement.getAttribute('src') : '';
    const header = raceBox.querySelector('.race-name').textContent;
    const date = raceBox.querySelector('.race-date').textContent;
    const location = raceBox.querySelector('.race-location').textContent;
    const raceType = raceBox.querySelector('.race-type').textContent;

    // Get distances HTML structure
    const distanceContainer = raceBox
      .querySelector('.distance-container')
      .cloneNode(true);

    // Update popup content
    customPopup.innerHTML = `
      <div class="popup-content">
        <button class="close-popup">&times;</button>
        <a href="${raceLink}" class="popup-container">
          <div class="popup-image">
            <img src="${imageUrl}" alt="${header}">
            <div class="overlay soft"></div>
            <div class="popup-info">
              <div class="popup-info-top">
                <div class="popup-date">
                  ${date}
                </div>
                <div class="popup-location">
                  ${location}
                </div>
              </div>
              <div class="popup-info-bottom">
                <div class="race-type">
                  <svg class="icon">
                    <use xlink:href="/icons/svg-sprite.svg#footsteps-icon"></use>
                  </svg>
                  ${raceType}
                </div>
                <div class="popup-distances">
                  ${distanceContainer.outerHTML}
                </div>
              </div>
              <h3 class="popup-title">${header}</h3>
            </div>
          </div>
        </a>
      </div>
    `;

    // Show popup
    customPopup.style.display = 'block';

    // Add close button functionality
    const closeButton = customPopup.querySelector('.close-popup');
    closeButton.addEventListener('click', () => {
      customPopup.style.display = 'none';
      // Reset marker color if needed
      const markerElement = marker.getElement().querySelector('svg');
      changeMarkerColor(markerElement, 'var(--color-warning)');
    });

    // Change marker color
    const markerElement = marker.getElement().querySelector('svg');
    changeMarkerColor(markerElement, 'var(--color-success)');

    // Move map to new position
    map.easeTo({
      center: [coordinates.lng, coordinates.lat - 2.5],
      duration: 1000,
    });
  }
}

function changeMarkerColor(markerElement, newColor) {
  const pathElement = markerElement.querySelector('path');
  pathElement.setAttribute('fill', newColor);

  // Change the z-index based on newColor
  if (newColor === 'var(--color-success)') {
    markerElement.style.zIndex = '1000';
  } else if (newColor === 'var(--color-warning)') {
    markerElement.style.zIndex = '0';
  }
}

// Add click event listener to each marker
markers.forEach((marker) => {
  marker.getElement().addEventListener('click', () => {
    handleMarkerClick(marker);
  });
});

// Add this function to show/hide markers based on race card visibility
function updateMarkerVisibility() {
  raceBoxes.forEach((raceBox, index) => {
    const marker = markers[index];
    if (marker) {
      if (raceBox.classList.contains('filtered-out')) {
        marker.getElement().style.display = 'none';
      } else {
        marker.getElement().style.display = 'block';
      }
    }
  });
}

// Add a MutationObserver to watch for changes in race card visibility
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.type === 'attributes' &&
      (mutation.attributeName === 'class' ||
        mutation.target.classList.contains('filtered-out'))
    ) {
      updateMarkerVisibility();
    }
  });
});

// Observe each race box for changes
raceBoxes.forEach((raceBox) => {
  observer.observe(raceBox, { attributes: true });
});

// Initial visibility check
updateMarkerVisibility();

// Add this after map initialization
map.on('click', () => {
  if (customPopup.style.display === 'block') {
    customPopup.style.display = 'none';
    // Reset all markers to default color
    markers.forEach((marker) => {
      const markerElement = marker.getElement().querySelector('svg');
      changeMarkerColor(markerElement, 'var(--color-warning)');
    });
  }
});

// Add click handler to popup to prevent closing when clicking inside it
customPopup.addEventListener('click', (event) => {
  event.stopPropagation();
});
