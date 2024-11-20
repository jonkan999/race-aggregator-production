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
  const coordinates = marker.getLngLat(); // Get marker coordinates
  console.log('Marker Clicked. Coordinates:', coordinates);
  /* setMarkerSvg(marker, hoverMarkerSVG); */

  // Find the corresponding venue-box
  const matchingRace = races.find((race) => {
    return (
      race.mapboxCenter[0] === coordinates.lng &&
      race.mapboxCenter[1] === coordinates.lat
    );
  });

  if (matchingRace) {
    // Find the index of the clicked marker in the markers array
    const markerIndex = markers.indexOf(marker);
    // Find the corresponding .venue-box element
    const raceBox = raceBoxes[races.indexOf(matchingRace)];
    const raceLink = raceBox ? raceBox.getAttribute('href') : ''; // Get the href attribute of the venue box element
    // Extract information from .venue-box
    // Select the first carousel-item within the venueBox
    const imageElement = raceBox.querySelector('.background-img');

    // Get the URL from the style attribute and replace double quotes with single quotes
    const imageUrl = imageElement ? imageElement.getAttribute('src') : '';

    const header = raceBox.querySelector('.race-name').textContent;
    const footer = raceBox.querySelector('.race-date').textContent;
    const distances = raceBox.querySelector('.race-distances').textContent;

    // Update the marker's SVG to hoverMarkerSVG
    /* marker.getElement().innerHTML = hoverMarkerSVG; */
    // Create and open a popup

    // Create and open a popup
    const popup = new mapboxgl.Popup({
      className: 'custom-popup',
      closeButton: true,
      closeOnClick: true,
      focusAfterOpen: false,
    }).setHTML(
      `
        <a href=${raceLink} class="popup-container">
        <div class="popup-image" >
          <img class="background-img" src=${imageUrl} alt="race image" />
          </div>
          <h3>${header}</h3>
          <div class="popup-footer">
            <ion-icon name="calendar-outline" aria-label="calendar"></ion-icon>
            <p>${footer}</p>
            <div class="popup-stars">
              <ion-icon name="flag-outline" aria-label="flag distance"></ion-icon>
              <p>${distances}  </p>
            </div>
          </div>
        </a>
      `
    );
    // Get the SVG element of the marker
    const markerElement = marker.getElement().querySelector('svg');

    marker
      .setPopup(popup) // sets a popup on this marker
      .addTo(map);

    popup.on('open', () => {
      if (!isPopupOpen) {
        // On the first popup opening, change the marker's color
        changeMarkerColor(markerElement, 'var(--color-success)');

        isPopupOpen = true; // Set the flag to true when popup is open
      }
    });

    popup.on('close', () => {
      if (isPopupOpen) {
        // Reset the marker's color to the original color only when popup is open
        changeMarkerColor(markerElement, 'var(--color-warning)');
        isPopupOpen = false; // Set the flag to false when popup is closed
      }
    });
  }
  // Listen for the popup close event
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