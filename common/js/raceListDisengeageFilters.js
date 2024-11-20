// Get references to the elements
const disengVenueSelector = document.querySelector('.section-race-cards');
const disengageFiltersSection = document.querySelector('.section-filters');
const disengageChildElements = disengageFiltersSection.children;
const header = document.querySelector('.header');

// Scroll position variables
let lastScrollPosition = window.scrollY;
const TopScrollThreshold = 33;
const downScrollThreshold = 20;

function handleScroll() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    const currentScrollPosition = window.scrollY;

    if (currentScrollPosition > lastScrollPosition + downScrollThreshold) {
      // Scrolling down
      hideFiltersSection();
    } else if (
      currentScrollPosition < lastScrollPosition - TopScrollThreshold ||
      currentScrollPosition < 150
    ) {
      // Scrolling up or near top
      showFiltersSection();
    }

    lastScrollPosition = currentScrollPosition;
  }
}

function hideFiltersSection() {
  disengageFiltersSection.style.opacity = '0';
  disengageFiltersSection.style.marginTop = '0';
  if (header) header.style.opacity = '0.4';

  Array.from(disengageChildElements).forEach((element) => {
    element.style.display = 'none';
  });
}

function showFiltersSection() {
  disengageFiltersSection.style.opacity = '1';
  disengageFiltersSection.style.marginTop = 'var(--header-size)';
  if (header) header.style.opacity = '1';

  Array.from(disengageChildElements).forEach((element) => {
    element.style.display = 'flex';
  });
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);
console.log('Scroll listener added to window');
