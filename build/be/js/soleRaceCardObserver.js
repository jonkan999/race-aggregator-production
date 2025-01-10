// Initialize intersection observer immediately
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Handle img elements
        const images = entry.target.querySelectorAll('img[data-src]');
        images.forEach((img) => {
          img.src = img.dataset.src;
          delete img.dataset.src;
        });

        // Handle source elements
        const sources = entry.target.querySelectorAll('source[data-srcset]');
        sources.forEach((source) => {
          source.srcset = source.dataset.srcset;
          delete source.dataset.srcset;
        });

        // Stop observing after loading
        observer.unobserve(entry.target);
      }
    });
  },
  {
    rootMargin: '200px 0px', // Preload images when they are 200px away from the viewport
    threshold: 0.1,
  }
);

// Start observing immediately when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const viewportHeight = window.innerHeight;
  const cards = document.querySelectorAll('.race-card');

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const isAboveFold = rect.top < viewportHeight;

    if (isAboveFold) {
      // For cards above fold, load image immediately
      const img = card.querySelector('img[data-src]');
      if (img) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      const source = card.querySelector('source[data-srcset]');
      if (source) {
        source.srcset = source.dataset.srcset;
        delete source.dataset.srcset;
      }
    } else {
      // Let Intersection Observer handle these
      observer.observe(card);
    }
  });
});