function initAdBanner() {
  const BANNER_DELAY = 2000;
  const AD_LOAD_TIMEOUT = 3000;
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
  adBanner.style.maxHeight = '90px'; // Add a max height constraint

  const showBanner = () => {
    const isMinimized = localStorage.getItem('adBannerMinimized') === 'true';
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

export { initAdBanner };