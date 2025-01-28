// Immediate executing preloader
(() => {
  function preloadVisibleImages() {
    const viewportHeight = window.innerHeight;
    const cards = document.querySelectorAll('.race-card');

    // Find all cards that are visible in viewport
    const visibleCards = Array.from(cards).filter((card) => {
      const rect = card.getBoundingClientRect();
      return rect.top < viewportHeight + 100;
    });

    // Create a document fragment to batch DOM operations
    const fragment = document.createDocumentFragment();

    // Create preload links
    visibleCards.forEach((card) => {
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

    // Insert preload links as early as possible in head
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head.firstChild) {
      head.insertBefore(fragment, head.firstChild);
    } else {
      head.appendChild(fragment);
    }
  }

  // Run as soon as DOM has basic structure
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadVisibleImages, {
      priority: 'high',
    });
  } else {
    preloadVisibleImages();
  }
})();