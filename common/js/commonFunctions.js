export { default as analytics } from './analytics.js';
export { initializeHeaderLogin as firebaseLogin } from './firebaseLogin.js';

// Ad banner initialization
export function initAdBanner() {
  const BANNER_DELAY = 2000;
  const adBanner = document.querySelector('.ad-banner');

  if (!adBanner) return;

  // Set initial state
  adBanner.style.cssText = `
    transform: translateY(100%);
    transition: transform 0.3s ease-in-out;
    height: var(--ad-banner-height);
    max-height: 100px;
  `;

  const showBanner = () => {
    const isMinimized = localStorage.getItem('adBannerMinimized') === 'true';

    // Initialize the ad only on production
    if (window.location.hostname !== 'localhost') {
      const adSlot = adBanner.querySelector('.adsbygoogle');
      if (adSlot) {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.warn('AdSense initialization error:', e);
        }
      }
    }

    // Show banner unless minimized
    if (!isMinimized) {
      adBanner.style.transform = 'translateY(0)';
    } else {
      adBanner.classList.add('minimized');
    }
  };

  const setupMinimizeButton = () => {
    const minimizeButton = adBanner.querySelector('.minimize-button');
    if (!minimizeButton) return;

    minimizeButton.addEventListener('click', () => {
      adBanner.classList.toggle('minimized');
      localStorage.setItem(
        'adBannerMinimized',
        adBanner.classList.contains('minimized')
      );
    });
  };

  // Show banner after delay
  setTimeout(showBanner, BANNER_DELAY);
  setupMinimizeButton();
}

// Add scroll detection for header shadow
function initHeaderShadow() {
  const header = document.querySelector('.section-header-menu');
  if (!header) return;

  const SCROLL_THRESHOLD = 100;

  window.addEventListener('scroll', () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Highlight active navigation item
function initActiveNavigation() {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-container');

  navItems.forEach((item) => {
    const href = item.getAttribute('href');
    if (
      (href !== '/' && currentPath.startsWith(href)) ||
      (href === '/' && currentPath === '/')
    ) {
      item.classList.add('active');
      // Smoothly scroll the active item into view
      setTimeout(() => {
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100); // Small delay to ensure DOM is ready
    } else {
      item.classList.remove('active');
    }
  });
}

// Call the functions when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  initHeaderShadow();
  initActiveNavigation();
  initAdBanner();
});
