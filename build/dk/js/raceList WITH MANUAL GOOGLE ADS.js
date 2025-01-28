document.addEventListener("DOMContentLoaded", function () {
  const distanceMapping = {"1,5km": ["1500 meter"], "10,1km": ["Millopp", "10 km"], "10,5km": ["Millopp", "10 km"], "10,6km": ["Millopp", "10 km"], "10,7km": ["Millopp", "10 km"], "100 miles": ["100 miles"], "100km": ["100 km", "50 miles"], "105km": ["100 km"], "107,8km": ["100 km"], "10km": ["Millopp", "10 km", "10000 meter"], "11km": ["Millopp", "10 km"], "20km": ["Halvmarathon"], "22km": ["Halvmarathon"], "350km": ["200 miles"], "3km": ["3000 meter"], "4,2km": ["5 km"], "4,7km": ["5 km"], "40,2km": ["Marathon"], "40km": ["Marathon"], "430km": ["200 miles"], "48km": ["50 km"], "4km": ["5 km"], "5,1km": ["5 km"], "5,3km": ["5 km"], "5,4km": ["5 km"], "5,5km": ["5 km"], "5,6km": ["5 km"], "5,8km": ["5 km"], "5,9km": ["5 km"], "50 miles": ["50 miles"], "50km": ["50 km"], "52,1km": ["50 km"], "54km": ["50 km"], "5km": ["5 km", "5000 meter"], "6km": ["5 km"], "85km": ["50 miles"], "90km": ["100 km", "50 miles"], "9km": ["Millopp", "10 km"], "half marathon": ["Halvmarathon"]};
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
  const dateRangeFrom = " fra";
  const dateRangeTo = " til";
  const dateRangeSingle = " i";

  // Add these new elements
  const raceTitleCategory = document.getElementById("race-cards-title-category");
  const raceTitleRegion = document.getElementById("race-cards-title-region");
  const defaultRegionText = "Danmark";
  const defaultCountyText = "Alle regioner";

  const categoryMapping = {"10 km": {"range": [9, 11]}, "100 km": {"range": [90, 110]}, "100 miles": {"range": [150, 170]}, "10000 meter": {"range": [10, 10]}, "1500 meter": {"range": [1.5, 1.5]}, "200 miles": {"range": [300, 500]}, "3000 meter": {"range": [3, 3]}, "5 km": {"range": [4, 6]}, "50 km": {"range": [45, 55]}, "50 miles": {"range": [75, 100]}, "5000 meter": {"range": [5, 5]}, "Backyard Ultra": "baghave", "Halvmarathon": {"range": [20, 22]}, "Marathon": {"range": [40, 44]}, "Millopp": {"range": [9, 11]}};

  // Retrieve pre-selected filters from data attribute
  const preselectedFilters = JSON.parse(document.getElementById("race-cards-container").getAttribute("data-preselected-filters"));

  // Add this function to manage ad insertion
   function insertAds() {
    const raceCards = Array.from(document.querySelectorAll('.race-card:not(.filtered-out):not(.paginated-out):not(.ad-card)'));
    const container = document.querySelector('.race-cards-grid');
    
    // Store existing ads and their positions
    const existingAds = Array.from(document.querySelectorAll('.ad-card')).map(ad => {
        const adSlots = ad.querySelectorAll('.adsbygoogle');
        return {
            element: ad,
            initialized: Array.from(adSlots).some(slot => slot.dataset.adStatus === 'filled')
        };
    });

    // Remove existing ads but keep their references
    existingAds.forEach(({element}) => element.remove());

    const isMobile = window.innerWidth < 544;
    const isTwoColumn = window.innerWidth >= 544 && window.innerWidth < 1104;
    const isThreeColumn = window.innerWidth >= 1104;

    let adCount = 0;
    const MAX_ADS = 5;
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000; // 1 second

    const initializeAd = async (adElement, retryCount = 0) => {
        const adSlots = adElement.querySelectorAll('.adsbygoogle');
        
        try {
            // Initialize all ad slots in the element
            await Promise.all(Array.from(adSlots).map(async (adSlot) => {
                if (!adSlot.dataset.adStatus || adSlot.dataset.adStatus === 'unfilled') {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    
                    // Wait for initialization
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Check if ad is still unfilled
                    if (retryCount < MAX_RETRIES && (!adSlot.dataset.adStatus || adSlot.dataset.adStatus === 'unfilled')) {
                        console.log(`Retrying ad initialization (attempt ${retryCount + 1})`);
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                        await initializeAd(adElement, retryCount + 1);
                    }
                }
            }));
        } catch (e) {
            console.warn('AdSense initialization error:', e);
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying after error (attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                await initializeAd(adElement, retryCount + 1);
            }
        }
    };

    raceCards.forEach((card, index) => {
        let shouldInsertAd = false;

        if (adCount >= MAX_ADS) return;

        if (isMobile) {
            shouldInsertAd = (index === 2) || (index > 1 && (index - 1) % 4 === 0);
        } else if (isTwoColumn) {
            shouldInsertAd = (index === 0) || (index > 0 && index % 4 === 0);
        } else if (isThreeColumn) {
            shouldInsertAd = (index === 0) || (index > 0 && index % 4 === 0);
        }

        if (shouldInsertAd && adCount < MAX_ADS) {
            // Reuse existing ad if available and filled
            const existingAd = existingAds[adCount];
            if (existingAd && existingAd.initialized) {
                card.before(existingAd.element);
            } else {
                const adElement = document.createElement('div');
                adElement.className = 'ad-card';
                adElement.innerHTML = `
                    <div class="ad-container">
                        <div class="desktop-wrapper">
                            <ins class="adsbygoogle"
                                 style="display:block"
                                 data-ad-client="ca-pub-7076760775175370"
                                 data-ad-slot="1598812305"
                                 data-ad-format="auto"
                                 data-full-width-responsive="true"></ins>
                        </div>
                        <div class="mobile-wrapper">
                            <ins class="adsbygoogle"
                                 style="display:block"
                                 data-ad-client="ca-pub-7076760775175370"
                                 data-ad-slot="9358545536"
                                 data-ad-format="auto"
                                 data-full-width-responsive="true"></ins>
                        </div>
                    </div>
                `;
                
                card.before(adElement);
                initializeAd(adElement);
            }
            adCount++;
        }
    });
  } 

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
      const redirectUrl = `/lobekalender/?category=${encodeURIComponent(currentFilters.category)}&county=${encodeURIComponent(currentFilters.county)}&race_type=${encodeURIComponent(currentFilters.race_type)}`;
      
      console.log(redirectUrl); // Log the redirect URL for debugging
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
    console.log("Original fromDate:", fromDate);
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

  function showPage(page) {
    const filteredCards = Array.from(raceCards).filter(
      (card) => !card.classList.contains("filtered-out")
    );
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    filteredCards.forEach((card, index) => {
      if (index >= start && index < end) {
        card.classList.remove("paginated-out");
      } else {
        card.classList.add("paginated-out");
      }
    });

    updatePagination();
    updateEventRange();
    updateURL(page);
    insertAds();
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
    eventRange.textContent = `${start}-${end} af ${filteredCards.length} `;
  }

  function updateURL(page) {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("page", page);
    history.pushState({ page: page }, "", newUrl);
  }

  function applyFilters() {
    const fromDate = dateFrom.value ? dateFrom.value.replace(/-/g, "") : null;
    const toDate = dateTo.value ? dateTo.value.replace(/-/g, "") : null;
    const county = countyFilter.value;
    const raceType = raceTypeFilter.value;

    // First, get all elements in their current order (including ads)
    const allElements = Array.from(document.querySelectorAll('.race-card, .google-auto-placed'));
    
    // Create a map to store the original positions of ads relative to visible races
    const adPositions = new Map();
    let visibleRaceCount = 0;
    
    allElements.forEach((element, index) => {
        if (element.classList.contains('google-auto-placed')) {
            adPositions.set(element, visibleRaceCount);
        } else if (!element.classList.contains('filtered-out')) {
            visibleRaceCount++;
        }
    });

    // Apply filters to race cards
    const raceCards = allElements.filter(el => !el.classList.contains('google-auto-placed'));
    raceCards.forEach((card) => {
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

    // Reposition ads based on remaining visible races
    let newVisibleCount = 0;
    const container = document.querySelector('.race-cards-grid');
    
    allElements.forEach((element) => {
        if (!element.classList.contains('filtered-out') && !element.classList.contains('google-auto-placed')) {
            newVisibleCount++;
        }
        
        if (element.classList.contains('google-auto-placed')) {
            const originalPosition = adPositions.get(element);
            if (newVisibleCount < originalPosition) {
                // Move ad to the end if there aren't enough visible races
                container.appendChild(element);
            }
        }
    });

    // Add this line to update clusters after filters are applied
    if (window.updateClusters) updateClusters();

    // Rest of your existing code...
    currentPage = 1;
    showPage(currentPage);
    updateRaceCardsTitle();
  }

  function updateDateRange() {
    const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo.value ? new Date(dateTo.value) : null;

    if (fromDate && toDate) {
      const fromYear = fromDate.getFullYear();
      const fromMonth = fromDate.toLocaleString("default", { month: "long" });
      const toYear = toDate.getFullYear();
      const toMonth = toDate.toLocaleString("default", { month: "long" });

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
    if (staticDescription) {
      staticDescription.style.display = 'none';
    }
  }
});

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
