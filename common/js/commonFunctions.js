export { default as analytics } from './analytics.js';
export { initializeHeaderLogin as firebaseLogin } from './firebaseLogin.js';

// Add scroll detection for header shadow
function initHeaderShadow() {
  const header = document.querySelector('.section-header-menu');
  if (!header) return;

  const SCROLL_THRESHOLD = 100; // Adjust this value (in pixels) as needed

  window.addEventListener('scroll', () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Call the function when the document is loaded
document.addEventListener('DOMContentLoaded', initHeaderShadow);

// Add other common functions here
//export function cleanFileName(filename) {
// Your implementation
//}
