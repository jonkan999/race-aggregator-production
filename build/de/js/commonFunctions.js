export { default as analytics } from './analytics.js';
export { initializeHeaderLogin as firebaseLogin } from './firebaseLogin.js';

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
      }, 50); // Small delay to ensure DOM is ready
    } else {
      item.classList.remove('active');
    }
  });
}

// Initialize features in order of priority
function initializeCriticalFeatures() {
  initHeaderShadow();
  initActiveNavigation();
}

function initializeAuthFeatures() {
  return import('./firebaseLogin.js').then(({ initializeHeaderLogin }) => {
    initializeHeaderLogin();
  });
}

function terminateFirestoreConnections() {
  // Force close any hanging connections
  const firestoreRequests = performance
    .getEntriesByType('resource')
    .filter((r) => r.name.includes('firestore.googleapis.com'));

  firestoreRequests.forEach((request) => {
    const controller = new AbortController();
    controller.abort();
  });
}

function initializeNonCriticalFeatures() {
  initializeAuthFeatures().then(() => {
    setTimeout(async () => {
      const analytics = (await import('./analytics.js')).default;
      await analytics.initialize();

      window.addEventListener('unload', () => {
        analytics.cleanup();
        terminateFirestoreConnections();
      });
    }, 50);
  });
}

// Call the functions when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize critical features immediately
  initializeCriticalFeatures();

  // Defer non-critical features
  requestIdleCallback(
    () => {
      initializeNonCriticalFeatures();
    },
    { timeout: 50 }
  );
});