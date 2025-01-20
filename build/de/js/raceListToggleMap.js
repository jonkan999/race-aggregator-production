// Get references to the button and sections

const toggleButtonMobile = document.getElementById('toggleMapButtonMobile');
const raceCardsSection = document.querySelector('.race-cards-grid');
const mapSection = document.querySelector('.map-placeholder');
const pagination = document.querySelector('.pagination');
const headerRaceCards = document.querySelector(
  '.section-race-cards-header-container'
);

// Set an initial state
let isMapClose = true;
const isMobile = window.innerWidth < 545;

// Add a click event listener to the button
toggleButtonMobile.addEventListener('click', async function () {
  // Toggle between the sections
  console.log('isMapClose', isMapClose);
  if (isMapClose) {
    raceCardsSection.style.display = 'none';
    mapSection.style.display = 'block';
    headerRaceCards.style.display = 'none';
    pagination.style.display = 'none';
    toggleButtonMobile.innerHTML = `
      <div class="icon-container">
        <ion-icon name="list-outline"></ion-icon>
      </div>
      <p>Liste</p>
    `;
    toggleButtonMobile.style.bottom = '2.5rem';
    toggleButtonMobile.classList.add('active');

    // Initialize map when showing it
    if (window.initializeMap) {
      await window.initializeMap();
    }
    if (window.updateClusters) {
      window.updateClusters();
    }

    //reset filter style on map open
    if (isMobile) {
      //reset filter style on map open
      const filtersSection = document.querySelector('.section-filters');
      if (filtersSection) {
        const childElements = filtersSection.children;
        filtersSection.style.opacity = '1';
        filtersSection.style.marginTop = 'var(--header-size)';
        filtersSection.style.position = 'fixed';
        for (let i = 0; i < childElements.length; i++) {
          childElements[i].style.display = 'flex';
        }
      }
    }
    isMapClose = false;
  } else {
    raceCardsSection.style.display = 'block';
    mapSection.style.display = 'none';
    pagination.style.display = 'flex';
    headerRaceCards.style.display = 'block';
    toggleButtonMobile.innerHTML = `
      <div class="icon-container">
        <ion-icon name="map-outline"></ion-icon>
      </div>
      <p>Karte</p>
    `;
    toggleButtonMobile.style.bottom = '6.5rem';
    toggleButtonMobile.classList.remove('active');
    isMapClose = true;
  }
});