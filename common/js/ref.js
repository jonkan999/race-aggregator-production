mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9ua2FueDMiLCJhIjoiY2xsdHRyNDU2MHUxYTNlbzdzZHB2aGkyZiJ9._hS--VA8nG49uiiDGpBK3w';

function setMarkerSvg(marker, svgContent) {
  marker.getElement().innerHTML = svgContent;
}

const defaultMarkerSVG = `
<svg display="block" height="31px" width="27px" viewBox="0 0 27 41">
  <g fill-rule="nonzero">
    <g transform="translate(3.0, 29.0)" fill="var(--black-background-color)">
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
    <g fill="var(--highlight-color)">
      <path d="M27,13.5 C27,19.074644 20.250001,27.000002 14.75,34.500002 C14.016665,35.500004 12.983335,35.500004 12.25,34.500002 C6.7499993,27.000002 0,19.222562 0,13.5 C0,6.0441559 6.0441559,0 13.5,0 C20.955844,0 27,6.0441559 27,13.5 Z"></path>
    </g>
    <g opacity="0.25" fill="var(--black-background-color)000">
      <path d="M13.5,0 C6.0441559,0 0,6.0441559 0,13.5 C0,19.222562 6.7499993,27 12.25,34.5 C13,35.522727 14.016664,35.500004 14.75,34.5 C20.250001,27 27,19.074644 27,13.5 C27,6.0441559 20.955844,0 13.5,0 Z M13.5,1 C20.415404,1 26,6.584596 26,13.5 C26,15.898657 24.495584,19.181431 22.220703,22.738281 C19.945823,26.295132 16.705119,30.142167 13.943359,33.908203 C13.743445,34.180814 13.612715,34.322738 13.5,34.441406 C13.387285,34.322738 13.256555,34.180814 13.056641,33.908203 C10.284481,30.127985 7.4148684,26.314159 5.015625,22.773438 C2.6163816,19.232715 1,15.953538 1,13.5 C1,6.584596 6.584596,1 13.5,1 Z"></path>
    </g>
    <g transform="translate(6.0, 7.0)" fill="#FFFFFF"></g>
    <g transform="translate(8.0, 8.0)">
      <circle
        fill="var(--black-background-color)000"
        opacity="0.25"
        cx="5.5"
        cy="5.5"
        r="5.4999962"
      ></circle>
      <circle fill="#FFFFFF" cx="5.5" cy="5.5" r="5.4999962"></circle>
    </g>
  </g>
</svg>`;
document.addEventListener('DOMContentLoaded', () => {
  // Access the map container element
  const mapContainer = document.getElementById('mapSection');

  // Initialize the map
  const map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/light-v10',
    center: [18.0645, 59.3126], // Default center coordinates
    zoom: 11,
  });
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
    const improveMapLink = document.querySelector(
      '.mapboxgl-ctrl-attrib-inner'
    );
    if (improveMapLink) {
      improveMapLink.parentNode.removeChild(improveMapLink);
    }
  });

  // Create a function to add a marker for a venue
  // Create a function to add a marker for a venue
  function addMarker(venue, index) {
    // Check if the corresponding venueBox should be generated
    const venueBox = venueBoxes[index];
    if (venueBox) {
      const marker = new mapboxgl.Marker()
        .setLngLat(venue.mapboxCenter)
        .addTo(map);
      setMarkerSvg(marker, defaultMarkerSVG);

      // Get the value of the data-name attribute from venueBox
      const dataNameValue = venueBox.getAttribute('data-name');

      // Add a data attribute to the marker with the data-name value
      marker.getElement().setAttribute('data-name', dataNameValue);
      // Add the marker to the map
      marker.addTo(map);
      // Store marker references in an array
      markers.push(marker);

      const markerElement = marker.getElement();

      venueBox.addEventListener('mouseenter', () => {
        changeMarkerColor(markerElement, 'var(--black-background-color)');
      });

      venueBox.addEventListener('mouseleave', () => {
        changeMarkerColor(markerElement, 'var(--highlight-color)');
      });

      venueBox.addEventListener('click', () => {
        changeMarkerColor(markerElement, 'var(--black-background-color)');
      });

      // Add an event listener to detect changes in venueBox's display style
      /*       const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.attributeName === "style") {
            const displayStyle = venueBox.style.display;
            // Update the marker's display style based on venueBox's style
            markerElement.style.display = displayStyle;
          }
        }
      });

      // Start observing changes in venueBox's style attribute
      observer.observe(venueBox, { attributes: true }); */
    }
  }

  // Collect venue-box elements and extract mapboxCenter from data-geocenter attribute
  const markers = []; // Array to store marker references
  const venues = [];
  const venueBoxes = document.querySelectorAll('.venues-section .venue-box');
  venueBoxes.forEach((venueBox, index) => {
    const geocenterAttr = venueBox.getAttribute('data-geocenter');
    if (geocenterAttr) {
      const coordinates = geocenterAttr
        .replace('[', '')
        .replace(']', '')
        .split(',')
        .map((coordinate) => parseFloat(coordinate.trim()));
      venues.push({ mapboxCenter: coordinates });
      // Call addMarker with the venue and index
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
    const matchingVenue = venues.find((venue) => {
      return (
        venue.mapboxCenter[0] === coordinates.lng &&
        venue.mapboxCenter[1] === coordinates.lat
      );
    });

    if (matchingVenue) {
      // Find the index of the clicked marker in the markers array
      const markerIndex = markers.indexOf(marker);
      // Find the corresponding .venue-box element
      const venueBox = venueBoxes[venues.indexOf(matchingVenue)];
      const venueLink = venueBox ? venueBox.getAttribute('href') : ''; // Get the href attribute of the venue box element
      // Extract information from .venue-box
      // Select the first carousel-item within the venueBox
      const imageElement = venueBox.querySelector('.image-inner-img');

      // Get the URL from the style attribute and replace double quotes with single quotes
      const imageUrl = imageElement ? imageElement.getAttribute('src') : '';

      const header = venueBox.querySelector(
        '.venue-box-info-header'
      ).textContent;
      const footer = venueBox.querySelector(
        '.venue-box-info-footer'
      ).textContent;
      // Update the marker's SVG to hoverMarkerSVG
      /* marker.getElement().innerHTML = hoverMarkerSVG; */
      // Create and open a popup

      // Create and open a popup
      const popup = new mapboxgl.Popup().setHTML(
        `
        <a href=${venueLink} class="popup-container">
        <div class="popup-image" >
          <img class="image-inner-img" src=${imageUrl} alt="venue image" />
          </div>
          <h3>${header}</h3>
          <div class="popup-footer">
            <ion-icon name="people-outline" aria-label="people outline"></ion-icon>
            <p>${footer}</p>
            <div class="popup-stars">
              <ion-icon name="star" aria-label="star"></ion-icon>
              <p>4.85</p>
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
          changeMarkerColor(markerElement, 'var(--black-background-color)');

          isPopupOpen = true; // Set the flag to true when popup is open
        }
      });

      popup.on('close', () => {
        if (isPopupOpen) {
          // Reset the marker's color to the original color only when popup is open
          changeMarkerColor(markerElement, 'var(--highlight-color)');
          isPopupOpen = false; // Set the flag to false when popup is closed
        }
      });
    }
    // Listen for the popup close event
  }
  function changeMarkerColor(markerElement, newColor) {
    // Assuming the markerElement is an SVG element
    const pathElement = markerElement.querySelector('path');
    pathElement.setAttribute('fill', newColor);

    // Change the z-index based on newColor
    if (newColor === 'var(--black-background-color)') {
      markerElement.style.zIndex = '1000'; // Adjust this value as needed
    } else if (newColor === 'var(--highlight-color)') {
      markerElement.style.zIndex = '0'; // Adjust this value as needed
    }
  }

  // Add click event listener to each marker
  markers.forEach((marker) => {
    marker.getElement().addEventListener('click', () => {
      handleMarkerClick(marker);
    });
  });
});
