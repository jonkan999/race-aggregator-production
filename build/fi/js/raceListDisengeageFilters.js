// Get references to the elements
const disengVenueSelector = document.querySelector('.section-race-cards');
const disengageFiltersSection = document.querySelector('.section-filters');
const disengageChildElements = disengageFiltersSection?.children;
const header = document.querySelector('.header');

// Adjusted scroll position variables
let lastScrollPosition = window.scrollY;
const minScrollBeforeHide = 150; // Minimum scroll position before hiding is allowed
const topScrollThreshold = 20; // How far to scroll up to show filters
const downScrollThreshold = 10; // How far to scroll down to hide filters (reduced for more sensitivity)

function handleScroll() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    const currentScrollPosition = window.scrollY;
    const scrollDelta = currentScrollPosition - lastScrollPosition;

    // Only allow hiding if we're scrolled down enough
    if (currentScrollPosition > minScrollBeforeHide) {
      if (scrollDelta > downScrollThreshold) {
        // Scrolling down - hide immediately
        hideFiltersSection();
      } else if (scrollDelta < -topScrollThreshold) {
        // Scrolling up - show immediately
        showFiltersSection();
      }
    } else {
      // Always show filters when near the top
      showFiltersSection();
    }

    lastScrollPosition = currentScrollPosition;
  }

  // Add shadow based on scroll position
  if (window.scrollY > 100) {
    // You can adjust this threshold
    disengageFiltersSection?.classList.add('scrolled');
  } else {
    disengageFiltersSection?.classList.remove('scrolled');
  }
}

function hideFiltersSection() {
  if (!disengageFiltersSection) return;
  disengageFiltersSection.style.opacity = '0';
  disengageFiltersSection.style.marginTop = '0';
  if (header) header.style.opacity = '0.4';

  Array.from(disengageChildElements || []).forEach((element) => {
    element.style.display = 'none';
  });
}

function showFiltersSection() {
  if (!disengageFiltersSection) return;
  disengageFiltersSection.style.opacity = '1';
  disengageFiltersSection.style.marginTop = 'var(--header-size)';
  if (header) header.style.opacity = '1';

  Array.from(disengageChildElements || []).forEach((element) => {
    element.style.display = 'flex';
  });
}

// Add scroll event listener with throttling for better performance
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
});