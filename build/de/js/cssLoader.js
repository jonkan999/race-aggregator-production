window.cssFiles = new Set();
window.cssLoaded = false;

function logCSSStatus() {
  console.log('Current CSS files waiting:', Array.from(window.cssFiles));
}

document.addEventListener('DOMContentLoaded', () => {
  const printStylesheets = document.querySelectorAll(
    'link[rel="stylesheet"][media="print"]'
  );
  console.log('Found print stylesheets:', printStylesheets.length);

  printStylesheets.forEach((link) => {
    window.cssFiles.add(link.href);

    link.addEventListener('load', () => {
      window.cssFiles.delete(link.href);
      console.log('CSS loaded:', link.href);
      logCSSStatus();

      if (window.cssFiles.size === 0) {
        window.cssLoaded = true;
        document.dispatchEvent(new Event('cssComplete'));
      }
    });

    link.addEventListener('error', (e) => {
      console.error('Failed to load CSS:', link.href);
      window.cssFiles.delete(link.href);
    });
  });
});