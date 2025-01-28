function unpackRaceCard(card) {
  if (card.classList.contains('filtered-out')) return;
  if (
    !card.classList.contains('packed') ||
    card.classList.contains('race-card-big')
  )
    return;
  console.log('🔍 Unpacking card:', card.dataset.name);

  const html = `
    <div class="race-card-upper-box background-container">
      <picture>
        <img
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          data-src="${card.dataset.src}"
          width="600"
          height="400"
          alt="${card.dataset.name}"
          class="background-img"
          onerror="this.onerror=null; this.src='/images/hero_small.webp';"
        />
      </picture>
      <div class="race-card-content">
        <div class="race-info-top">
          <div class="race-date">${card.dataset.dateDisplay}</div>
          <div class="race-location">${card.dataset.county}</div>
        </div>
      </div>
      <div class="overlay soft"></div>
    </div>

    <div class="race-info-bottom">
      <div class="upper-container">
        <div class="left-container">
          <h3 class="race-name">${card.dataset.name}</h3>
          ${
            card.dataset.location
              ? `
            <div class="race-location ${
              card.dataset.distance ? 'with-spacing' : ''
            }">
              <svg class="icon">
                <use xlink:href="/icons/svg-sprite.svg#location-icon"></use>
              </svg>
              ${card.dataset.location}
            </div>
          `
              : ''
          }
        </div>
        <div class="right-container">
          ${
            card.dataset.distance
              ? `
            <div class="race-distances with-spacing">
              <svg class="icon">
                <use xlink:href="/icons/svg-sprite.svg#flag-icon"></use>
              </svg>
              <div class="distance-container">
                ${card.dataset.distance
                  .split(', ')
                  .map(
                    (distance) => `
                  <div class="distance-item">
                    <span class="race-distance">${distance}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }
          ${
            card.dataset.type
              ? `
            <div class="race-type">
              <svg class="icon">
                <use xlink:href="/icons/svg-sprite.svg#footsteps-icon"></use>
              </svg>
              ${card.dataset.typeDisplay}
            </div>
          `
              : ''
          }
        </div>
      </div>
      <div class="race-summary">
        ${card.dataset.description}${
    card.dataset.description.length > 140 ? '...' : ''
  }
      </div>
    </div>
    <div class="cta-button ${card.dataset.distance ? 'with-spacing' : ''}">
      <div class="more-info-button">${
        window.raceCardCtaText || 'More Info'
      }</div>
    </div>
  `;

  card.innerHTML = html;
  card.classList.remove('packed');
  console.log('📦 Unpacked card:', card.dataset.name);
}

async function startPreloader() {
  try {
    console.log('🚀 Starting image preloader');

    // Get all cards and apply filters first
    const regularCards = document.querySelectorAll(
      '.race-card:not(.race-card-big)'
    );
    const bigCards = document.querySelectorAll('.race-card.race-card-big');
    console.log(
      `📊 Found ${regularCards.length} regular race cards and ${bigCards.length} big cards`
    );

    // Apply filters
    const urlParams = new URLSearchParams(window.location.search);
    const county = urlParams.get('county') || '';
    const raceType = urlParams.get('race_type') || '';
    const category = urlParams.get('category') || '';

    // Get date range with defaults
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    const fromDate = today.toISOString().split('T')[0].replace(/-/g, '');
    const toDate = nextYear.toISOString().split('T')[0].replace(/-/g, '');

    // First, apply all filters
    const visibleCards = [];
    regularCards.forEach((card) => {
      let show = true;

      // URL filters
      if (county && card.dataset.county !== county) show = false;
      if (raceType && card.dataset.raceType !== raceType) show = false;
      if (category && !card.dataset.distance?.includes(category)) show = false;

      // Date filter
      const raceDate = card.dataset.date;
      if (raceDate < fromDate || raceDate > toDate) show = false;

      if (!show) {
        card.classList.add('filtered-out');
        console.log(`🚫 Filtered out: ${card.dataset.name}`);
        return;
      }

      visibleCards.push(card);
    });

    console.log(`✨ ${visibleCards.length} cards passed filtering`);

    // Create promises for all initial card loads
    const loadPromises = [];

    // Handle regular cards
    visibleCards.slice(0, 3).forEach((card) => {
      console.log(`🎯 Unpacking regular card: ${card.dataset.name}`);
      unpackRaceCard(card);

      // Create promise for image load
      const img = card.querySelector('img[data-src]');
      if (img && img.dataset.src) {
        loadPromises.push(
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Resolve even on error to prevent hanging
            console.log('🖼️ Loading image for:', card.dataset.name);
            img.src = img.dataset.src;
            delete img.dataset.src;
          })
        );
      }
    });

    // Handle big cards
    bigCards.forEach((card) => {
      const img = card.querySelector('img[data-src]');
      if (img && img.dataset.src) {
        loadPromises.push(
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            console.log('🖼️ Loading big card image for:', card.dataset.name);
            img.src = img.dataset.src;
            delete img.dataset.src;
          })
        );
      }
    });

    // Wait for all initial images to load
    await Promise.all([
      Promise.all(loadPromises),
      new Promise((resolve) => setTimeout(resolve, 500)), // Minimum time to prevent flash
    ]);

    // Remove loader
    console.log('🎉 Initial loading complete');
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      await new Promise((resolve) => setTimeout(resolve, 50));
      loader.remove();
    }
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  } catch (error) {
    console.error('❌ Error in preloader:', error);
    // Ensure loader is removed even if there's an error
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove();
  }
}

// Keep the fallback timeout
setTimeout(() => {
  if (!document.body.classList.contains('loaded')) {
    console.warn('⚠️ Fallback loader removal triggered');
    document.body.classList.add('loaded');
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove();
  }
}, 2000);

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPreloader);
} else {
  startPreloader();
}
