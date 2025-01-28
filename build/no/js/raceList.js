// Initialize intersection observer immediately
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Handle img elements
        const images = entry.target.querySelectorAll('img[data-src]');
        images.forEach((img) => {
          // Create new image to test loading
          const testImage = new Image();
          testImage.onload = () => {
            img.src = testImage.src;
            delete img.dataset.src;
          };
          testImage.onerror = () => {
            // Fallback if image fails to load
            img.src = '/images/hero_small.webp';
            delete img.dataset.src;
          };
          testImage.src = img.dataset.src;
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
    rootMargin: '100% 0px 100% 0px', // Preload images when they are 200px away from the viewport
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

// Wait for both DOM and resources before initializing
async function initializeWhenReady() {
  try {
    console.log('🔍 Starting initialization');
    document.body.classList.add('loading');
    
    await Promise.all([
      document.fonts.ready,
      new Promise(resolve => {
        if (document.readyState !== 'complete') {
          window.addEventListener('load', resolve);
        } else {
          resolve();
        }
      })
    ]);

    // Calculate viewport and initial visible cards
    const viewportHeight = window.innerHeight;
    const cards = document.querySelectorAll('.race-card');
    const visibleCards = Array.from(cards).filter(card => {
      const rect = card.getBoundingClientRect();
      return rect.top < viewportHeight;
    });

    // Only preload images for visible cards
    const imagePromises = visibleCards.map(card => {
      // Unpack the visible card
      if (card.classList.contains('packed')) {
        unpackRaceCard(card);
      }
      
      // Load its image
      const img = card.querySelector('img[data-src]');
      if (img) {
        return createImageLoadPromise(img);
      }
      return Promise.resolve();
    });

    // Let Intersection Observer handle all other cards
    cards.forEach(card => {
      if (!visibleCards.includes(card)) {
        observer.observe(card);
      }
    });

    // Wait for visible images
    await Promise.all([
      Promise.all(imagePromises),
      new Promise(resolve => setTimeout(resolve, 500))
    ]);

    // Remove loader
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      await new Promise(resolve => setTimeout(resolve, 50));
      loader.remove();
      document.body.classList.remove('loading');
      document.body.classList.add('loaded');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove();
  }

  // Your existing initialization code
  const distanceMapping = {"1,5km": ["1500 meter"], "10,2km": ["Mill\u00f8p", "10 km"], "10,3km": ["Mill\u00f8p", "10 km"], "100 miles": ["100 miles"], "100km": ["50 miles", "100 km"], "10km": ["Mill\u00f8p", "10000 meter", "10 km"], "11km": ["Mill\u00f8p", "10 km"], "150km": ["100 miles"], "20km": ["Halvmaraton"], "21,8km": ["Halvmaraton"], "22km": ["Halvmaraton"], "3km": ["3000 meter"], "4,1km": ["5 km"], "4,2km": ["5 km"], "4,3km": ["5 km"], "4,4km": ["5 km"], "4,5km": ["5 km"], "4,6km": ["5 km"], "4,8km": ["5 km"], "400km": ["200 miles"], "43,4km": ["Maraton"], "45km": ["50 km"], "48km": ["50 km"], "4km": ["5 km"], "5,2km": ["5 km"], "5,4km": ["5 km"], "5,5km": ["5 km"], "5,6km": ["5 km"], "5,7km": ["5 km"], "5,8km": ["5 km"], "50 miles": ["50 miles"], "50km": ["50 km"], "52,2km": ["50 km"], "52,5km": ["50 km"], "55km": ["50 km"], "5km": ["5 km", "5000 meter"], "6km": ["5 km"], "75km": ["50 miles"], "76km": ["50 miles"], "88km": ["50 miles"], "9,3km": ["Mill\u00f8p", "10 km"], "9,5km": ["Mill\u00f8p", "10 km"], "95km": ["50 miles", "100 km"], "9km": ["Mill\u00f8p", "10 km"], "half marathon": ["Halvmaraton"], "marathon": ["Maraton"]};
  const raceCards = document.querySelectorAll(".race-card");
  const itemsPerPage = 20;
  let currentPage = 1;
  let totalPages = Math.ceil(raceCards.length / itemsPerPage);
  const totalEvents = raceCards.length;
  let activeCategories = new Set();

  const prevButton = document.getElementById("prev-page");
  const nextButton = document.getElementById("next-page");
  const pageNumbers = document.getElementById("page-numbers");
  const eventRange = document.getElementById("event-range");
  const totalEventsSpan = document.getElementById("total-events");

  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");
  const countyFilter = document.getElementById("county");
  const raceTypeFilter = document.getElementById("race-type");

  const dateRangeSpan = document.getElementById("date-range");

  // Jinja-inserted values
  const dateRangeFrom = " fra ";
  const dateRangeTo = " til ";
  const dateRangeSingle = " i ";

  // Add these new elements
  const raceTitleCategory = document.getElementById("race-cards-title-category");
  const raceTitleRegion = document.getElementById("race-cards-title-region");
  const defaultRegionText = "Norge";
  const defaultCountyText = "Alle fylker";

  const country_code = "no";
  const language_code = "no";

  const categoryMapping = {"10 km": {"range": [9, 11]}, "100 km": {"range": [90, 110]}, "100 miles": {"range": [150, 170]}, "10000 meter": {"range": [10, 10]}, "1500 meter": {"range": [1.5, 1.5]}, "200 miles": {"range": [300, 500]}, "3000 meter": {"range": [3, 3]}, "5 km": {"range": [4, 6]}, "50 km": {"range": [45, 55]}, "50 miles": {"range": [75, 100]}, "5000 meter": {"range": [5, 5]}, "Backyard Ultra": "backyard", "Halvmaraton": {"range": [20, 22]}, "Maraton": {"range": [40, 44]}, "Mill\u00f8p": {"range": [9, 11]}};

  // Retrieve pre-selected filters from data attribute
  const preselectedFilters = JSON.parse(document.getElementById("race-cards-container").getAttribute("data-preselected-filters"));

  // Function to check filters and redirect if necessary
  function checkFilters() {
    const currentFilters = {
      category: null,
      county: null,
      race_type: null
    };

    // Get current filter values - handle multiple categories
    const activeCategoryButtons = document.querySelectorAll(".category-button.active");
    if (activeCategoryButtons.length > 0) {
      currentFilters.category = Array.from(activeCategoryButtons)
        .map(button => button.getAttribute("data-category"))
        .join(", ");
    } else {
      currentFilters.category = "";
    }
    
    currentFilters.county = countyFilter.value || "";
    currentFilters.race_type = raceTypeFilter.value || "";

    // Check only the filters that were initially preselected
    let filtersChanged = false;

    if (preselectedFilters.category) {
      // Check if category was preselected and has changed
      if (currentFilters.category !== preselectedFilters.category) {
        filtersChanged = true;
      }
    }

    if (preselectedFilters.county) {
      // Check if county was preselected and has changed
      if (currentFilters.county !== preselectedFilters.county) {
        filtersChanged = true;
      }
    }

    if (preselectedFilters.race_type) {
      // Check if race_type was preselected and has changed
      if (currentFilters.race_type !== preselectedFilters.race_type) {
        filtersChanged = true;
      }
    }

    if (filtersChanged) {
      console.log("Preselected filters were changed, redirecting...");
      
      // Construct the redirect URL
      const redirectUrl = `/terminliste/?category=${encodeURIComponent(currentFilters.category)}&county=${encodeURIComponent(currentFilters.county)}&race_type=${encodeURIComponent(currentFilters.race_type)}`;
      
      console.log(redirectUrl); // Log the redirect URL for debugging
      window.location.href = redirectUrl;
    }
  }

  // Set active selections based on preselected filters
  if (preselectedFilters) {
    initializeCategories();
    
    if (preselectedFilters.county) {
      countyFilter.value = preselectedFilters.county;
    }
    if (preselectedFilters.race_type) {
      raceTypeFilter.value = preselectedFilters.race_type;
    }
  }

  if (
    !prevButton ||
    !nextButton ||
    !pageNumbers ||
    !eventRange ||
    !totalEventsSpan ||
    !dateFrom ||
    !dateTo ||
    !countyFilter ||
    !raceTypeFilter
  ) {
    console.error("One or more required elements are missing from the DOM");
    return;
  }

  // Set initial values for date inputs
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);

  dateFrom.valueAsDate = today;
  dateTo.valueAsDate = nextYear;

  const categoryButtons = document.querySelectorAll(".category-button");


  // Add event listeners to category buttons
  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const category = this.getAttribute("data-category");
      const allButton = document.querySelector('.category-button[data-category="all"]');
      
      if (category === "all") {
        // If "all" is clicked, deactivate all other categories
        activeCategories.clear();
        categoryButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
      } else {
        // If specific category is clicked
        if (allButton) {
          allButton.classList.remove("active");
        }
        
        if (activeCategories.has(category)) {
          activeCategories.delete(category);
          this.classList.remove("active");
          
          // If no categories are selected, activate "all"
          if (activeCategories.size === 0 && allButton) {
            allButton.classList.add("active");
          }
        } else {
          activeCategories.add(category);
          this.classList.add("active");
        }
      }
      switchToDynamicHeader();
      applyFilters();
      if (preselectedFilters) checkFilters();
    });
  });

  const monthButtons = document.querySelectorAll(".month-button");
  let activeMonth = null;

  // Add event listeners to month buttons
  monthButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const month = this.getAttribute("data-month");
      const allButton = document.querySelector('.month-button[data-category="all"]');
      
      if (month === "all") {
        // If "all" is clicked, reset to default year view
        monthButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
        resetDateRange();
      } else {
        // If specific month is clicked
        monthButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
        updateDateRangeForMonth(month);
      }
      applyFilters();
    });
  });

  function updateDateRangeForMonth(month) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    let year = currentYear;
    if (parseInt(month) < currentMonth) {
      year++;
    }

    const fromDate = new Date(year, parseInt(month) - 1, 1);
    const toDate = new Date(year, month, 0);
    // Adjust for timezone offset
    const adjustedFromDate = new Date(
      fromDate.getTime() - fromDate.getTimezoneOffset() * 60000
    );
    const adjustedToDate = new Date(
      toDate.getTime() - toDate.getTimezoneOffset() * 60000
    );
    dateFrom.valueAsDate = adjustedFromDate;
    dateTo.valueAsDate = adjustedToDate;

    updateDateRange();
  }

  function resetDateRange() {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    dateFrom.valueAsDate = today;
    dateTo.valueAsDate = nextYear;

    updateDateRange();
  }

  function unpackRaceCard(card) {
    // Skip if card is already unpacked or is a selected race card
    if (!card.classList.contains('packed') || card.classList.contains('race-card-big')) return;
    
    // Create full card HTML while preserving all data attributes
    const html = `
      <div class="race-card-upper-box background-container">
        <picture>
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            data-src="${card.dataset.imagePath}"
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
            ${card.dataset.location ? `
              <div class="race-location ${card.dataset.distance ? 'with-spacing' : ''}">
                <svg class="icon">
                  <use xlink:href="/icons/svg-sprite.svg#location-icon"></use>
                </svg>
                ${card.dataset.location}
              </div>
            ` : ''}
          </div>
          <div class="right-container">
            ${card.dataset.distance ? `
              <div class="race-distances with-spacing">
                <svg class="icon">
                  <use xlink:href="/icons/svg-sprite.svg#flag-icon"></use>
                </svg>
                <div class="distance-container">
                  ${card.dataset.distance.split(', ').map(distance => `
                    <div class="distance-item">
                      <span class="race-distance">${distance}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            ${card.dataset.type ? `
              <div class="race-type">
                <svg class="icon">
                  <use xlink:href="/icons/svg-sprite.svg#footsteps-icon"></use>
                </svg>
                ${card.dataset.typeDisplay}
              </div>
            ` : ''}
          </div>
        </div>
        <div class="race-summary">
          ${card.dataset.description}${card.dataset.description.length > 140 ? '...' : ''}
        </div>
      </div>
      <div class="cta-button ${card.dataset.distance ? 'with-spacing' : ''}">
        <div class="more-info-button">${window.raceCardCtaText || 'More Info'}</div>
      </div>
    `;
    
    // Replace placeholder with full content
    card.innerHTML = html;
    card.classList.remove('packed');
    
    // Initialize lazy loading for this card
    observer.observe(card);
  }

  function packRaceCard(card) {
    // Skip if card is already packed or is a selected race card
    if (card.classList.contains('packed') || card.classList.contains('race-card-big')) return;
    
    // Create simple placeholder HTML
    const html = `
        <div class="race-card-placeholder">
            <div class="race-name">${card.dataset.name}</div>
            <div class="race-date">${card.dataset.dateDisplay}</div>
        </div>
    `;
    
    // Replace content with placeholder
    card.innerHTML = html;
    card.classList.add('packed');
  }

  // Modify showPage function to handle packing/unpacking
  function showPage(page) {
    const filteredCards = Array.from(raceCards).filter(
        (card) => !card.classList.contains("filtered-out") && !card.classList.contains("race-card-big")
    );
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    filteredCards.forEach((card, index) => {
        if (index >= start && index < end) {
            card.classList.remove("paginated-out");
            unpackRaceCard(card);
        } else {
            card.classList.add("paginated-out");
            packRaceCard(card);
        }
    });

    // Pack filtered-out cards (excluding selected races)
    raceCards.forEach(card => {
        if (card.classList.contains("filtered-out") && !card.classList.contains("race-card-big")) {
            packRaceCard(card);
        }
    });

    updatePagination();
    updateEventRange();
    updateURL(page);
  }

  function updatePagination() {
    const filteredCards = Array.from(raceCards).filter(
      (card) => !card.classList.contains("filtered-out")
    );
    totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));

    // Clear existing page numbers
    pageNumbers.innerHTML = "";

    // Previous button
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
      }
    };

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      pageNumbers.appendChild(createPageButton(1));
      if (startPage > 2) {
        pageNumbers.appendChild(createEllipsis());
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.appendChild(createPageButton(i));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.appendChild(createEllipsis());
      }
      pageNumbers.appendChild(createPageButton(totalPages));
    }

    // Next button
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        showPage(currentPage);
      }
    };
  }

  function createPageButton(pageNum) {
    const button = document.createElement("button");
    button.textContent = pageNum;
    button.classList.toggle("active", pageNum === currentPage);
    button.onclick = () => {
      currentPage = pageNum;
      showPage(currentPage);
    };
    return button;
  }

  function createEllipsis() {
    const ellipsis = document.createElement("span");
    ellipsis.textContent = "...";
    ellipsis.className = "ellipsis";
    return ellipsis;
  }

  function updateEventRange() {
    const filteredCards = Array.from(raceCards).filter(
      (card) => !card.classList.contains("filtered-out")
    );
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredCards.length);
    eventRange.textContent = `${start}-${end} av ${filteredCards.length} `;
  }

  function updateURL(page) {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("page", page);
    history.pushState({ page: page }, "", newUrl);
  }

  function applyFilters() {
    // Remove all auto-placed ads first
    document.querySelectorAll('.google-auto-placed').forEach(ad => ad.remove());
    
    const fromDate = dateFrom.value ? dateFrom.value.replace(/-/g, "") : null;
    const toDate = dateTo.value ? dateTo.value.replace(/-/g, "") : null;
    const county = countyFilter.value;
    const raceType = raceTypeFilter.value;

    // Apply filters to race cards
    Array.from(raceCards).forEach((card) => {
        const raceDate = card.getAttribute("data-date");
        const raceCounty = card.getAttribute("data-county");
        const raceDistances = card.getAttribute("data-distance");
        const raceTypeAttr = card.getAttribute("data-race-type");

        let show = true;

        if (fromDate && raceDate < fromDate) show = false;
        if (toDate && raceDate > toDate) show = false;
        if (county && raceCounty !== county) show = false;

        // Modified race type filtering to handle backyard/frontyard
        if (raceType) {
            // Normalize race types to lowercase simple format
            const normalizedRaceType = raceType.toLowerCase().replace(' ultra', '');
            const normalizedRaceTypeAttr = raceTypeAttr ? raceTypeAttr.toLowerCase().replace(' ultra', '') : '';
            
            const isBackyardOrFrontyard = normalizedRaceType === 'backyard' || normalizedRaceType === 'frontyard';
            
            if (isBackyardOrFrontyard) {
                // Check both race-type and distances for backyard/frontyard
                const distances = raceDistances ? raceDistances.split(', ') : [];
                const matchesInDistances = distances.some(distance => 
                    distance.toLowerCase().includes(normalizedRaceType)
                );
                
                if (!(normalizedRaceTypeAttr === normalizedRaceType || matchesInDistances)) {
                    show = false;
                }
            } else {
                // Normal race type filtering for other types
                if (normalizedRaceTypeAttr !== normalizedRaceType) show = false;
            }
        }

        // Category (distance) filtering
        if (activeCategories.size > 0 && !activeCategories.has("all")) {
            const distances = raceDistances ? raceDistances.split(', ') : [];
            
            const matchesActiveCategory = Array.from(activeCategories).some(category => 
                distances.some(distance => 
                    distanceMapping[distance] && distanceMapping[distance].includes(category)
                )
            );

            if (!matchesActiveCategory) {
                show = false;
            }
        }

        if (show) {
            card.classList.remove("filtered-out");
        } else {
            card.classList.add("filtered-out");
        }
    });

    currentPage = 1;
    showPage(currentPage);
    updateRaceCardsTitle();
  }

  function updateDateRange() {
    const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo.value ? new Date(dateTo.value) : null;

    const userLocale = language_code;

    if (fromDate && toDate) {
        const fromYear = fromDate.getFullYear();
        const fromMonth = fromDate.toLocaleString(userLocale, { month: "long" });
        const toYear = toDate.getFullYear();
        const toMonth = toDate.toLocaleString(userLocale, { month: "long" });

        if (fromYear === toYear && fromMonth === toMonth) {
            dateRangeSpan.textContent = `${dateRangeSingle}${fromMonth} ${fromYear}`;
        } else {
            dateRangeSpan.textContent = `${dateRangeFrom}${fromMonth} ${fromYear}${dateRangeTo}${toMonth} ${toYear}`;
        }
    } else {
        dateRangeSpan.textContent = "";
    }
  }

  // Add event listeners to filters
  dateFrom.addEventListener("change", function() {
    switchToDynamicHeader();
    applyFilters();
  });
  dateTo.addEventListener("change", function() {
    switchToDynamicHeader();
    applyFilters();
  });
  countyFilter.addEventListener("change", function() {
    switchToDynamicHeader();
    applyFilters();
    if (preselectedFilters) checkFilters(); // Check filters after applying
  });
  raceTypeFilter.addEventListener("change", function() {
    switchToDynamicHeader();
    applyFilters();
    if (preselectedFilters) checkFilters(); // Check filters after applying
  });

  dateFrom.addEventListener("change", updateDateRange);
  dateTo.addEventListener("change", updateDateRange);

  // Handle initial page load
  const urlParams = new URLSearchParams(window.location.search);
  const initialPage = parseInt(urlParams.get("page")) || 1;
  currentPage = Math.max(1, Math.min(initialPage, totalPages));
  applyFilters(); // Apply filters on initial load
  showPage(currentPage);
  updateEventRange();
  updateDateRange();

  // Handle browser back/forward
  window.addEventListener("popstate", function (event) {
    if (event.state && event.state.page) {
      currentPage = event.state.page;
      showPage(currentPage);
    }
  });

  // Add this to your CSS
  const style = document.createElement("style");
  style.textContent = `
    .filtered-out, .paginated-out {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // Read URL parameters and set initial filter values
  //const urlParams = new URLSearchParams(window.location.search);

  // Set county filter
  if (urlParams.get('county')) {
    countyFilter.value = urlParams.get('county');
  }

  // Set race type filter
  if (urlParams.get('race_type')) {
    raceTypeFilter.value = urlParams.get('race_type');
  }

  // Set category filter - handle multiple categories
  if (urlParams.get('category')) {
    const urlCategories = urlParams.get('category').split(',').map(cat => cat.trim());
    const categoryButtons = document.querySelectorAll(".category-button");
    categoryButtons.forEach((button) => {
      const buttonCategory = button.getAttribute("data-category");
      if (urlCategories.includes(buttonCategory)) {
        button.classList.add("active");
        activeCategories.add(buttonCategory);
      }
    });
  }
  // Add map initialization class if map=true
  if (urlParams.get('map') === 'true') {
    const mapButton = document.getElementById('toggleMapButtonMobile');
    if (mapButton) {
      mapButton.click();
    }
  }


  // Apply filters after setting initial values from URL
  applyFilters();

  // Clear URL parameters after applying filters
  if (window.location.search) {
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  // Function to update the highlight of the select element based on its value
  function updateSelectHighlight(selectElement) {
    if (selectElement.value === "" || selectElement.value === "Alla loppstyper") {
      selectElement.classList.remove("highlight"); // Remove highlight class
    } else {
      selectElement.classList.add("highlight"); // Add highlight class
    }
  }

  // Get the race type select element
  const raceTypeSelect = document.getElementById("race-type");

  // Add event listener to update highlight on change for race type
  raceTypeSelect.addEventListener("change", function() {
    updateSelectHighlight(this);
  });

  // Initial highlight check on page load for race type
  updateSelectHighlight(raceTypeSelect);

  // Get the county select element
  const countySelect = document.getElementById("county");

  // Add event listener to update highlight on change for county
  countySelect.addEventListener("change", function() {
    updateSelectHighlight(this);
  });

  // Initial highlight check on page load for county
  updateSelectHighlight(countySelect);

  // Add this new function to update the title
  function updateRaceCardsTitle() {
    // Update category part
    if (activeCategories.size > 0) {
      raceTitleCategory.textContent = Array.from(activeCategories).join(", ");
    } else {
      raceTitleCategory.textContent = "";
    }

    // Update region part
    if (countyFilter.value && countyFilter.value !== defaultCountyText) {
      raceTitleRegion.textContent = countyFilter.value;
    } else {
      raceTitleRegion.textContent = defaultRegionText;
    }
  }

  // Make sure to call updateRaceCardsTitle on initial load
  updateRaceCardsTitle();

  // Add these styles to your CSS
  const styles = `
    .ad-card {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }

    @media (min-width: 768px) {
      .desktop-only {
        display: block;
      }

      .mobile-only {
        display: none;
      }
    }
  `;

  // Insert styles
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  function initializeCategories() {
    const allButton = document.querySelector('.category-button[data-category="all"]');
    
    // Initialize the Set if it hasn't been already
    if (!activeCategories) {
      activeCategories = new Set();
    }
    
    if (preselectedFilters && preselectedFilters.category) {
      // If we have a preselected category
      if (allButton) {
        allButton.classList.remove("active");
      }
      
      const categoryButtons = document.querySelectorAll(".category-button");
      categoryButtons.forEach((button) => {
        const buttonCategory = button.getAttribute("data-category");
        if (buttonCategory === preselectedFilters.category) {
          button.classList.add("active");
          activeCategories.add(buttonCategory);
        }
      });
    } else {
      // No preselected category, ensure "all" is active
      if (allButton) {
        allButton.classList.add("active");
      }
    }
  }

  function switchToDynamicHeader() {
    const staticHeader = document.querySelector('.static-header');
    const dynamicHeader = document.querySelector('.dynamic-header');
    const staticDescription = document.querySelector('.static-description');
    const isMapActive = document.querySelector('.toggle-button.mobile.active');
    console.log('isMapActive', isMapActive);
    if (staticHeader && dynamicHeader && !isMapActive) {
      console.log('switching to dynamic header');
      staticHeader.style.display = 'none';
      dynamicHeader.style.display = 'block';
    }
    if (staticDescription && dynamicHeader) {
      staticDescription.style.display = 'none';
    }
  }

  // Function to mark above-fold elements
  function markAboveFoldElements() {
    const viewportHeight = window.innerHeight;
    const cards = document.querySelectorAll('.race-card');
    
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const isAboveFold = rect.top < viewportHeight;
      
      if (isAboveFold) {
        // For cards above fold, load image immediately
        const img = card.querySelector('img[data-src]');
        if (img) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
      } else {
        // Let Intersection Observer handle these
        observer.observe(card);
      }
    });
  }

  // Run on initial load
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for layout to settle
    requestAnimationFrame(() => {
      markAboveFoldElements();
    });
  });

  // Update on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(markAboveFoldElements, 50);
  });
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWhenReady);
} else {
  initializeWhenReady();
}

// Add fallback to show content after 3 seconds
setTimeout(() => {
  if (!document.body.classList.contains('loaded')) {
    document.body.classList.add('loaded');
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove();
  }
}, 2000);

document.addEventListener('DOMContentLoaded', function() {
  const containers = document.querySelectorAll('.race-card-big-container');
  
  containers.forEach(container => {
    const prevButton = container.parentElement.querySelector('.scroll-button.prev');
    const nextButton = container.parentElement.querySelector('.scroll-button.next');
    
    if (!prevButton || !nextButton) return;

    const scrollAmount = container.offsetWidth * 0.8; // 80% of container width
    
    const updateButtons = () => {
      prevButton.disabled = container.scrollLeft <= 0;
      nextButton.disabled = 
        container.scrollLeft >= container.scrollWidth - container.offsetWidth - 10; // 10px buffer
    };

    prevButton.addEventListener('click', () => {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    nextButton.addEventListener('click', () => {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    container.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateButtons);
    
    // Initial state
    updateButtons();
  });
});

// Helper function for image loading promise
function createImageLoadPromise(img) {
  return new Promise((resolve) => {
    if (!img.dataset.src) {
      resolve();
      return;
    }
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = img.dataset.src;
      delete img.dataset.src;
      resolve();
    };
    tempImg.onerror = () => {
      img.src = '/images/hero_small.webp';
      delete img.dataset.src;
      resolve();
    };
    tempImg.src = img.dataset.src;
  });
}
