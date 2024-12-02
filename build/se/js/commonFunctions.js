export { default as analytics } from './analytics.js';
export { initializeHeaderLogin as firebaseLogin } from './firebaseLogin.js';

// Ad banner initialization
export function initAdBanner() {
  const BANNER_DELAY = 2000;
  const adBanner = document.querySelector('.ad-banner');

  if (!adBanner) return;

  // Remove any inline styles that might interfere
  adBanner.style.cssText = '';
  const adContent = adBanner.querySelector('.ad-content');
  if (adContent) {
    adContent.style.cssText = '';
  }

  // Set initial state
  adBanner.style.transform = 'translateY(100%)';
  adBanner.style.transition = 'transform 0.3s ease-in-out';
  adBanner.style.height = 'var(--ad-banner-height)';
  adBanner.style.maxHeight = '90px';

  const showBanner = () => {
    const isMinimized = localStorage.getItem('adBannerMinimized') === 'true';

    // Initialize the ad
    const adContainer = adBanner.querySelector('#ad-container');
    if (adContainer) {
      const adSlot = adContainer.querySelector('.adsbygoogle');
      if (adSlot && window.location.hostname !== 'localhost') {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});
          // Hide placeholder once ad is initialized
          const placeholder = adBanner.querySelector('.ad-placeholder');
          if (placeholder) {
            placeholder.style.display = 'none';
          }
          adContainer.style.display = 'block';
        } catch (e) {
          console.warn('AdSense initialization error:', e);
        }
      }
    }

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