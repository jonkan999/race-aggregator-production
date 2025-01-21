let mapInitialized = false;
let cachedVisibilityState = new Map(); // Move this to the top

async function initializeMap() {
  if (mapInitialized) return;
  console.log('initializeMap');
  // Import dependencies only when needed
  const { keyLoaded } = await import('./keys.js');
  const MAPBOX_API_KEY = await keyLoaded;

  // Initialize Mapbox
  mapboxgl.accessToken = MAPBOX_API_KEY;

  // Initialize marker arrays
  let singleMarkers = [];
  let clusterMarkers = [];

  // Constants for clustering
  const CLUSTER_RADIUS = 20;
  const CLUSTER_ZOOM_THRESHOLD = 15;

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

  // Add this function at the top with other utility functions
  function generateRaceHash(latitude, longitude, name) {
    return `${latitude}_${longitude}_${name}`.replace(/\s+/g, '_');
  }

  // Modify the addMarker function
  function addMarker(race, raceBox) {
    if (raceBox) {
      const marker = new mapboxgl.Marker()
        .setLngLat(race.mapboxCenter)
        .addTo(map);
      setMarkerSvg(marker, defaultMarkerSVG);

      const dataNameValue = raceBox.getAttribute('data-name');
      const hash = generateRaceHash(
        raceBox.getAttribute('data-latitude'),
        raceBox.getAttribute('data-longitude'),
        dataNameValue
      );

      marker.getElement().setAttribute('data-name', dataNameValue);
      marker.getElement().setAttribute('data-race-hash', hash);

      race.hash = hash; // Store hash in race object

      const markerElement = marker.getElement();

      raceBox.setAttribute('data-race-hash', hash); // Add hash to raceBox

      // Add click event listener directly here
      markerElement.addEventListener('click', () => {
        handleMarkerClick(marker);
      });

      raceBox.addEventListener('mouseenter', () => {
        changeMarkerColor(markerElement, 'var(--color-success)');
      });

      raceBox.addEventListener('mouseleave', () => {
        changeMarkerColor(markerElement, 'var(--color-warning)');
      });

      raceBox.addEventListener('click', () => {
        changeMarkerColor(markerElement, 'var(--color-success)');
      });

      return marker; // Return the marker for tracking in singleMarkers/clusterMarkers
    }
  }

  // Modify the race collection section
  const races = [];
  const raceBoxes = document.querySelectorAll('.race-cards-grid .race-card');
  raceBoxes.forEach((raceBox) => {
    const latitude = parseFloat(raceBox.getAttribute('data-latitude'));
    const longitude = parseFloat(raceBox.getAttribute('data-longitude'));
    const name = raceBox.getAttribute('data-name');

    if (!isNaN(latitude) && !isNaN(longitude)) {
      const coordinates = [longitude, latitude];
      const hash = generateRaceHash(latitude, longitude, name);
      const race = {
        mapboxCenter: coordinates,
        element: raceBox,
        name: name,
        hash: hash,
      };
      races.push(race);
      // Initialize cache entry
      cachedVisibilityState.set(
        hash,
        raceBox.classList.contains('filtered-out')
      );
    }
  });

  // Add this helper function to calculate dynamic offset
  function calculateMapOffset(currentZoom) {
    // Base offset at zoom level 11 (default) is 2.5
    const baseOffset = 3.5;
    const baseZoom = zoom;

    // Calculate relative offset based on current zoom
    // As we zoom in (higher zoom), we need smaller offset
    const zoomFactor = Math.pow(2, baseZoom - currentZoom);
    return baseOffset * zoomFactor;
  }

  // Modify the handleMarkerClick function
  function handleMarkerClick(marker) {
    event.stopPropagation();
    const hash = marker.getElement().getAttribute('data-race-hash');
    const matchingRace = races.find((race) => race.hash === hash);

    if (matchingRace) {
      const raceBox = matchingRace.element;
      const isPacked = raceBox.classList.contains('packed');

      // Get data based on whether the card is packed or not
      const raceLink = isPacked
        ? raceBox.dataset.href
        : raceBox.getAttribute('href') || '';
      const header = isPacked
        ? raceBox.dataset.name
        : raceBox.querySelector('.race-name').textContent;
      const date = isPacked
        ? raceBox.dataset.dateDisplay
        : raceBox.querySelector('.race-date').textContent;
      const location = isPacked
        ? raceBox.dataset.location
        : raceBox.querySelector('.race-location').textContent;
      const raceType = isPacked
        ? raceBox.dataset.typeDisplay
        : raceBox.querySelector('.race-type').textContent;

      // Handle image URL
      let imageUrl;
      if (isPacked) {
        imageUrl = `${raceBox.dataset.imagePath}_1.webp`;
      } else {
        const imageElement = raceBox.querySelector('.background-img');
        imageUrl = imageElement
          ? imageElement.getAttribute('data-src') ||
            imageElement.getAttribute('src')
          : '';
      }

      // Handle distances
      let distancesHtml;
      if (isPacked) {
        distancesHtml = `
                <div class="distance-container">
                    ${raceBox.dataset.distance
                      .split(', ')
                      .map(
                        (distance) => `
                        <div class="distance-item">
                            <span class="race-distance">${distance}</span>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            `;
      } else {
        const distanceContainer = raceBox.querySelector('.distance-container');
        distancesHtml = distanceContainer ? distanceContainer.outerHTML : '';
      }

      customPopup.innerHTML = `
            <div class="popup-content">
                <button class="close-popup">&times;</button>
                <a href="${raceLink}" class="popup-container">
                    <div class="popup-image">
                        <img src="${imageUrl}" alt="${header}">
                        <div class="overlay soft"></div>
                        <div class="popup-info">
                            <div class="popup-info-top">
                                <div class="popup-date">${date}</div>
                                <div class="popup-location">${location}</div>
                            </div>
                            <div class="popup-info-bottom">
                                <div class="race-type">
                                    <svg class="icon">
                                        <use xlink:href="/icons/svg-sprite.svg#footsteps-icon"></use>
                                    </svg>
                                    ${raceType}
                                </div>
                                <div class="popup-distances">
                                    ${distancesHtml}
                                </div>
                            </div>
                            <h3 class="popup-title">${header}</h3>
                        </div>
                    </div>
                </a>
            </div>
        `;

      // Rest of the function remains the same
      customPopup.style.display = 'block';
      const coordinates = marker.getLngLat();

      const closeButton = customPopup.querySelector('.close-popup');
      closeButton.addEventListener('click', () => {
        customPopup.style.display = 'none';
        const markerElement = marker.getElement().querySelector('svg');
        changeMarkerColor(markerElement, 'var(--color-warning)');
      });

      const markerElement = marker.getElement().querySelector('svg');
      changeMarkerColor(markerElement, 'var(--color-success)');

      const currentZoom = map.getZoom();
      const offset = calculateMapOffset(currentZoom);

      map.easeTo({
        center: [coordinates.lng, coordinates.lat - offset],
        duration: 1000,
      });
    }
  }

  // Modify the updateClusters function
  window.updateClusters = function updateClusters(showLoader = false) {
    if (mapContainer && mapContainer.style.display === 'none') return;
    if (!shouldUpdateClusters()) return;

    // Comment out loader functionality for now since clustering is fast
    // if (showLoader) {
    //   showMapLoader();
    // }

    requestAnimationFrame(() => {
      // Use cached visibility state instead of querying DOM
      const visibleRaces = races.filter(
        (race) => !cachedVisibilityState.get(race.hash)
      );

      // Calculate new marker state
      const newState = {
        singleMarkers: [],
        clusterMarkers: [],
      };

      const currentZoom = map.getZoom();

      if (currentZoom >= CLUSTER_ZOOM_THRESHOLD) {
        newState.singleMarkers = visibleRaces.map((race) => ({
          race,
          coordinates: race.mapboxCenter,
        }));
      } else {
        // Calculate clusters
        const clusters = [];
        visibleRaces.forEach((race) => {
          const coordinates = race.mapboxCenter;

          // Find existing cluster
          let cluster = clusters.find((c) =>
            shouldClusterMarkers(
              { lng: coordinates[0], lat: coordinates[1] },
              { lng: c.center[0], lat: c.center[1] },
              map
            )
          );

          if (cluster) {
            cluster.races.push(race);
          } else {
            clusters.push({
              center: coordinates,
              races: [race],
            });
          }
        });

        // Convert clusters to marker state
        clusters.forEach((cluster) => {
          if (cluster.races.length === 1) {
            newState.singleMarkers.push({
              race: cluster.races[0],
              coordinates: cluster.center,
            });
          } else {
            newState.clusterMarkers.push({
              coordinates: cluster.center,
              races: cluster.races,
            });
          }
        });
      }

      // Apply changes in batch
      requestAnimationFrame(() => {
        singleMarkers.forEach((marker) => marker.remove());
        clusterMarkers.forEach((marker) => marker.remove());
        singleMarkers = [];
        clusterMarkers = [];

        newState.singleMarkers.forEach(({ race, coordinates }) => {
          const marker = addMarker(race, race.element);
          if (marker) singleMarkers.push(marker);
        });

        newState.clusterMarkers.forEach(({ coordinates, races }) => {
          const marker = addClusterMarker(coordinates, races);
          if (marker) clusterMarkers.push(marker);
        });

        // Comment out loader hide
        // if (showLoader) {
        //   hideMapLoader();
        // }
      });
    });
  };

  // Update the visibility handler to use the cache
  function updateMarkerVisibility() {
    races.forEach((race) => {
      const raceBox = race.element;
      cachedVisibilityState.set(
        race.hash,
        raceBox.classList.contains('filtered-out')
      );
    });

    // Update actual marker visibility using cached state
    [...singleMarkers, ...clusterMarkers].forEach((marker) => {
      const hash = marker.getElement().getAttribute('data-race-hash');
      marker.getElement().style.display = cachedVisibilityState.get(hash)
        ? 'none'
        : 'block';
    });
  }

  // Modify the MutationObserver to ensure cache is updated before clustering
  const observer = new MutationObserver((mutations) => {
    let needsUpdate = false;

    mutations.forEach((mutation) => {
      if (
        mutation.type === 'attributes' &&
        (mutation.attributeName === 'class' ||
          mutation.target.classList.contains('filtered-out'))
      ) {
        // Update cache for this specific race
        const raceBox = mutation.target;
        const hash = raceBox.getAttribute('data-race-hash');
        if (hash) {
          cachedVisibilityState.set(
            hash,
            raceBox.classList.contains('filtered-out')
          );
        }
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      requestAnimationFrame(() => {
        // Ensure cache is fully up to date
        races.forEach((race) => {
          const raceBox = race.element;
          cachedVisibilityState.set(
            race.hash,
            raceBox.classList.contains('filtered-out')
          );
        });

        updateClusters(true);
      });
    }
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
      [...singleMarkers, ...clusterMarkers].forEach((marker) => {
        const markerElement = marker.getElement().querySelector('svg');
        changeMarkerColor(markerElement, 'var(--color-warning)');
      });
    }
  });

  // Add click handler to popup to prevent closing when clicking inside it
  customPopup.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  function changeMarkerColor(markerElement, newColor) {
    // For regular markers
    const pathElement = markerElement.querySelector('path');
    if (pathElement) {
      pathElement.setAttribute('fill', newColor);
    }

    // For cluster markers (modify the main circle fill)
    const circleElement = markerElement.querySelector('circle[fill="#FFFFFF"]');
    if (circleElement) {
      // Change the stroke color of the circle
      const strokeCircle = markerElement.querySelector('circle[stroke]');
      if (strokeCircle) {
        strokeCircle.setAttribute('stroke', newColor);
      }
      // Change the text color
      const textElement = markerElement.querySelector('text');
      if (textElement) {
        textElement.setAttribute('fill', newColor);
      }
    }

    // Change the z-index based on newColor
    if (newColor === 'var(--color-success)') {
      markerElement.style.zIndex = '1000';
    } else if (newColor === 'var(--color-warning)') {
      markerElement.style.zIndex = '0';
    }
  }

  // Add new helper function to check if markers are close enough to cluster
  function shouldClusterMarkers(coord1, coord2, map) {
    // Cache the projected points for coordinates that are checked multiple times
    if (!coord1._projected) {
      coord1._projected = map.project([coord1.lng, coord1.lat]);
    }
    if (!coord2._projected) {
      coord2._projected = map.project([coord2.lng, coord2.lat]);
    }

    const dx = coord1._projected.x - coord2._projected.x;
    const dy = coord1._projected.y - coord2._projected.y;

    // Use multiplication instead of Math.pow
    // And avoid Math.sqrt by comparing squared values
    return dx * dx + dy * dy < CLUSTER_RADIUS * CLUSTER_RADIUS;
  }

  // Update the cluster marker SVG template to remove the transform
  const clusterMarkerSVG = (count) => `
<svg width="30" height="30" viewBox="0 0 30 30">
  <g>
    <circle 
      fill="#FFFFFF" 
      stroke="var(--color-warning)" 
      stroke-width="2" 
      cx="15" 
      cy="15" 
      r="12">
    </circle>
    <text 
      x="15" 
      y="15" 
      text-anchor="middle" 
      dominant-baseline="central" 
      fill="var(--color-warning)" 
      font-size="12px" 
      font-weight="bold">
      ${count}
    </text>
  </g>
</svg>`;

  // Add this helper function at the top of the file
  function shouldUpdateClusters() {
    // Check if it's a mobile device (you can adjust the width threshold as needed)
    const isMobile = window.innerWidth < 545;

    // Check if map is visible (assuming the map has a toggle class when active)
    const isMapVisible =
      document.querySelector('.toggle-button.mobile.active') !== null;

    // Only update clusters if either:
    // 1. It's not a mobile device, or
    // 2. It's a mobile device AND the map is visible
    return !isMobile || (isMobile && isMapVisible);
  }

  // Add this near the top of the file with other utility functions
  function showMapLoader() {
    const mapContainer = document.getElementById('map-placeholder');
    let loader = mapContainer.querySelector('.map-loader');

    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'map-loader';
      loader.innerHTML = `
        <div class="loader-content">
          <div class="loader-spinner"></div>
        </div>
      `;
      mapContainer.appendChild(loader);
    }

    loader.style.display = 'flex';
  }

  function hideMapLoader() {
    const loader = document.querySelector('.map-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  // Add this function after the addMarker function
  function addClusterMarker(coordinates, cluster) {
    // coordinates should already be [longitude, latitude]

    const markerElement = document.createElement('div');
    markerElement.className = 'cluster-marker';

    const marker = new mapboxgl.Marker({
      element: markerElement,
    })
      .setLngLat(coordinates) // Mapbox expects [longitude, latitude]
      .addTo(map);

    setMarkerSvg(marker, clusterMarkerSVG(cluster.length));

    marker.getElement().addEventListener('click', () => {
      handleClusterClick(marker, cluster);
    });

    return marker;
  }

  // Add new function to handle cluster clicks
  function handleClusterClick(marker, races) {
    event.stopPropagation();

    // Change cluster marker color to success
    const markerElement = marker.getElement();
    const strokeCircle = markerElement.querySelector('circle[stroke]');
    const textElement = markerElement.querySelector('text');
    if (strokeCircle)
      strokeCircle.setAttribute('stroke', 'var(--color-success)');
    if (textElement) textElement.setAttribute('fill', 'var(--color-success)');

    let currentIndex = 0;
    const totalRaces = races.length;

    // Create popup content with navigation
    const popupHTML = `
        <div class="popup-content">
            <button class="close-popup">&times;</button>
            <div class="popup-navigation">
                <div class="popup-counter">Race ${
                  currentIndex + 1
                } of ${totalRaces}</div>
                <div class="popup-nav-buttons">
                    <button class="nav-button prev" ${
                      currentIndex === 0 ? 'disabled' : ''
                    }>
                        <svg viewBox="0 0 24 24">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <button class="nav-button next" ${
                      currentIndex === totalRaces - 1 ? 'disabled' : ''
                    }>
                        <svg viewBox="0 0 24 24">
                            <path transform="rotate(180 12 12)" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                </div>
            </div>
            ${createRacePopupContent(races[0])}
        </div>
    `;

    customPopup.innerHTML = popupHTML;
    customPopup.style.display = 'block';

    // Add navigation functionality
    const counter = customPopup.querySelector('.popup-counter');
    const prevButton = customPopup.querySelector('.nav-button.prev');
    const nextButton = customPopup.querySelector('.nav-button.next');
    const popupContent = customPopup.querySelector('.popup-content');

    function updateSlide(index) {
      currentIndex = index;

      // Update counter
      counter.textContent = `Race ${currentIndex + 1} / ${totalRaces}`;

      // Update buttons
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex === totalRaces - 1;

      // Update content with fade effect
      const oldContent =
        popupContent.querySelector('.popup-image').parentElement;
      const newContent = createRacePopupContent(races[currentIndex]);

      oldContent.style.opacity = '0';
      setTimeout(() => {
        oldContent.outerHTML = newContent;
        requestAnimationFrame(() => {
          popupContent.querySelector(
            '.popup-image'
          ).parentElement.style.opacity = '1';
        });
      }, 200);
    }

    prevButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex > 0) {
        updateSlide(currentIndex - 1);
      }
    });

    nextButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex < totalRaces - 1) {
        updateSlide(currentIndex + 1);
      }
    });

    // Handle close button
    const closeButton = customPopup.querySelector('.close-popup');
    closeButton.addEventListener('click', () => {
      customPopup.style.display = 'none';
      // Reset cluster marker color to warning
      if (strokeCircle)
        strokeCircle.setAttribute('stroke', 'var(--color-warning)');
      if (textElement) textElement.setAttribute('fill', 'var(--color-warning)');
    });

    // Center map on cluster
    const coordinates = marker.getLngLat();
    const currentZoom = map.getZoom();
    const offset = calculateMapOffset(currentZoom);

    map.easeTo({
      center: [coordinates.lng, coordinates.lat - offset],
      duration: 1000,
    });
  }

  // Extract popup content creation to reusable function
  function createRacePopupContent(race) {
    // Check if we're dealing with a packed race card
    const isPacked = race.element.classList.contains('packed');

    if (isPacked) {
      const raceBox = race.element;
      return `
            <a href="${raceBox.href}" class="popup-container">
                <div class="popup-image">
                    <img src="${raceBox.dataset.imagePath}_1.webp" alt="${
        raceBox.dataset.name
      }">
                    <div class="overlay soft"></div>
                    <div class="popup-info">
                        <div class="popup-info-top">
                            <div class="popup-date">${
                              raceBox.dataset.dateDisplay
                            }</div>
                            <div class="popup-location">${
                              raceBox.dataset.location
                            }</div>
                        </div>
                        <div class="popup-info-bottom">
                            <div class="race-type">
                                <svg class="icon">
                                    <use xlink:href="/icons/svg-sprite.svg#footsteps-icon"></use>
                                </svg>
                                ${raceBox.dataset.typeDisplay}
                            </div>
                            <div class="popup-distances">
                                <div class="distance-container">
                                    ${raceBox.dataset.distance
                                      .split(', ')
                                      .map(
                                        (distance) => `
                                        <div class="distance-item">
                                            <span class="race-distance">${distance}</span>
                                        </div>
                                    `
                                      )
                                      .join('')}
                                </div>
                            </div>
                        </div>
                        <h3 class="popup-title">${raceBox.dataset.name}</h3>
                    </div>
                </div>
            </a>
        `;
    } else {
      // Original code for unpacked races
      const raceBox = race.element;
      const raceLink = raceBox.getAttribute('href') || '';
      const imageElement = raceBox.querySelector('.background-img');

      // Check for both data-src (not yet loaded) and src (already loaded)
      const imageUrl = imageElement
        ? imageElement.getAttribute('data-src') ||
          imageElement.getAttribute('src')
        : '';

      const header = raceBox.querySelector('.race-name').textContent;
      const date = raceBox.querySelector('.race-date').textContent;
      const location = raceBox.querySelector('.race-location').textContent;
      const raceType = raceBox.querySelector('.race-type').textContent;
      const distanceContainer = raceBox
        .querySelector('.distance-container')
        .cloneNode(true);

      return `
            <a href="${raceLink}" class="popup-container">
                <div class="popup-image">
                    <img src="${imageUrl}" alt="${header}">
                    <div class="overlay soft"></div>
                    <div class="popup-info">
                        <div class="popup-info-top">
                            <div class="popup-date">${date}</div>
                            <div class="popup-location">${location}</div>
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
        `;
    }
  }

  // Modify map event listeners to update clusters
  map.on('zoomend', () => updateClusters(false));
  map.on('load', () => {
    if (mapContainer && mapContainer.style.display !== 'none') {
      updateClusters(false);
    }
  });

  mapInitialized = true;
}

// Export the initialization function
window.initializeMap = initializeMap;