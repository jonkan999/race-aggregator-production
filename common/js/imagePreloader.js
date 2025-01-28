// Immediate executing preloader
(() => {
  function applyInitialFilters() {
    // Get filter values from URL or defaults
    const urlParams = new URLSearchParams(window.location.search);
    const county = urlParams.get('county') || '';
    const raceType = urlParams.get('race_type') || '';
    const category = urlParams.get('category') || '';

    // Get all race cards
    const cards = document.querySelectorAll('.race-card');

    cards.forEach((card) => {
      let show = true;

      // Apply county filter
      if (county && card.dataset.county !== county) {
        show = false;
      }

      // Apply race type filter
      if (raceType && card.dataset.raceType !== raceType) {
        show = false;
      }

      // Apply category filter
      if (category && !card.dataset.distance?.includes(category)) {
        show = false;
      }

      if (!show) {
        card.classList.add('filtered-out');
      }
    });

    return Array.from(cards).filter(
      (card) => !card.classList.contains('filtered-out')
    );
  }

  function preloadVisibleImages() {
    // First apply filters
    const visibleCards = applyInitialFilters();

    // Then find which filtered cards are above the fold
    const viewportHeight = window.innerHeight;
    const aboveFoldCards = visibleCards.filter((card) => {
      const rect = card.getBoundingClientRect();
      return rect.top < viewportHeight + 100;
    });

    // Create preload links for above-fold cards
    const fragment = document.createDocumentFragment();
    aboveFoldCards.forEach((card) => {
      const imagePath = card.dataset.imagePath;
      if (imagePath) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imagePath;
        link.type = 'image/webp';
        link.fetchPriority = 'high';
        fragment.appendChild(link);
      }
    });

    // Insert preload links as early as possible
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head.firstChild) {
      head.insertBefore(fragment, head.firstChild);
    } else {
      head.appendChild(fragment);
    }
  }

  // Run as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadVisibleImages, {
      priority: 'high',
    });
  } else {
    preloadVisibleImages();
  }
})();
