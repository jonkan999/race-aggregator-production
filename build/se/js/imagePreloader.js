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

function startPreloader() {
  console.log('🚀 Starting image preloader');

  // Get all regular cards and big cards
  const regularCards = document.querySelectorAll(
    '.race-card:not(.race-card-big)'
  );
  const bigCards = document.querySelectorAll('.race-card.race-card-big');
  console.log(
    `📊 Found ${regularCards.length} regular race cards and ${bigCards.length} big race cards`
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
  const visibleRegularCards = [];
  const visibleBigCards = [];

  // Filter function to reuse logic
  const shouldShowCard = (card) => {
    // URL filters
    if (county && card.dataset.county !== county) return false;
    if (raceType && card.dataset.raceType !== raceType) return false;
    if (category && !card.dataset.distance?.includes(category)) return false;

    // Date filter
    const raceDate = card.dataset.date;
    if (raceDate < fromDate || raceDate > toDate) return false;

    return true;
  };

  regularCards.forEach((card) => {
    if (!shouldShowCard(card)) {
      card.classList.add('filtered-out');
      console.log(`🚫 Filtered out regular: ${card.dataset.name}`);
      return;
    }
    visibleRegularCards.push(card);
  });

  bigCards.forEach((card) => {
    if (!shouldShowCard(card)) {
      card.classList.add('filtered-out');
      console.log(`🚫 Filtered out big: ${card.dataset.name}`);
      return;
    }
    visibleBigCards.push(card);
  });

  console.log(
    `✨ ${visibleRegularCards.length} regular cards and ${visibleBigCards.length} big cards passed filtering`
  );

  // Function to handle card unpacking and image loading
  const processCard = (card) => {
    console.log(`🎯 Unpacking card: ${card.dataset.name}`);
    unpackRaceCard(card);

    // Load the image immediately
    const img = card.querySelector('img[data-src]');
    if (img && img.dataset.src) {
      console.log('🖼️ Loading image for:', card.dataset.name);
      img.src = img.dataset.src;
      delete img.dataset.src;
    }
  };

  // Process first three of each type
  visibleRegularCards.slice(0, 3).forEach(processCard);
  visibleBigCards.slice(0, 3).forEach(processCard);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPreloader);
} else {
  startPreloader();
}
