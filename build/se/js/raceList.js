document.addEventListener("DOMContentLoaded", function () {
  const distanceMapping = {"1,5km": ["1500 meter"], "10,5km": ["10 km", "Millopp"], "100 miles": ["100 miles"], "100km": ["50 miles", "100 km"], "10km": ["10000 meter", "10 km", "Millopp"], "11km": ["10 km", "Millopp"], "20km": ["Halvmarathon"], "22km": ["Halvmarathon"], "3km": ["3000 meter"], "4,3km": ["5 km"], "44km": ["Marathon"], "45km": ["50 km"], "46km": ["50 km"], "4km": ["5 km"], "50 miles": ["50 miles"], "50km": ["50 km"], "5km": ["5 km", "5000 meter"], "6km": ["5 km"], "84km": ["50 miles"], "96km": ["50 miles", "100 km"], "9km": ["10 km", "Millopp"], "half marathon": ["Halvmarathon"], "marathon": ["Marathon"]};
  const raceCards = document.querySelectorAll(".race-card");
  const itemsPerPage = 20;
  let currentPage = 1;
  let totalPages = Math.ceil(raceCards.length / itemsPerPage);
  const totalEvents = raceCards.length;

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
  const dateRangeFrom = " från ";
  const dateRangeTo = " till ";
  const dateRangeSingle = " i ";

  // Add these new elements
  const raceTitleCategory = document.getElementById("race-cards-title-category");
  const raceTitleRegion = document.getElementById("race-cards-title-region");
  const defaultRegionText = "Sverige";
  const defaultCountyText = "Alla län";

  const categoryMapping = {"10 km": {"range": [9, 11]}, "100 km": {"range": [90, 110]}, "100 miles": {"range": [150, 170]}, "10000 meter": {"range": [10, 10]}, "1500 meter": {"range": [1.5, 1.5]}, "200 miles": {"range": [300, 500]}, "3000 meter": {"range": [3, 3]}, "5 km": {"range": [4, 6]}, "50 km": {"range": [45, 55]}, "50 miles": {"range": [75, 100]}, "5000 meter": {"range": [5, 5]}, "Backyard Ultra": "backyard", "Halvmarathon": {"range": [20, 22]}, "Marathon": {"range": [40, 44]}, "Millopp": {"range": [9, 11]}};

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
      const redirectUrl = `/loppkalender.html?category=${encodeURIComponent(currentFilters.category)}&county=${encodeURIComponent(currentFilters.county)}&race_type=${encodeURIComponent(currentFilters.race_type)}`;
      
      console.log(redirectUrl); // Log the redirect URL for debugging
      window.location.href = redirectUrl; // Uncomment to enable redirect
    }
  }

  // Set active selections based on preselected filters
  if (preselectedFilters) {
    if (preselectedFilters.category) {
      const categoryButtons = document.querySelectorAll(".category-button");
      categoryButtons.forEach((button) => {
        if (button.getAttribute("data-category") === preselectedFilters.category) {
          button.classList.add("active");
        }
      });
    }
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
  let activeCategories = new Set();

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
        // If specific category is clicked, deactivate "all"
        allButton.classList.remove("active");
        
        if (activeCategories.has(category)) {
          activeCategories.delete(category);
          this.classList.remove("active");
          
          // If no categories are selected, activate "all"
          if (activeCategories.size === 0) {
            allButton.classList.add("active");
          }
        } else {
          activeCategories.add(category);
          this.classList.add("active");
        }
      }
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
    const fromDate = dateFrom.value ? dateFrom.value.replace(/-/g, "") : null;
    const toDate = dateTo.value ? dateTo.value.replace(/-/g, "") : null;
    const county = countyFilter.value;
    const raceType = raceTypeFilter.value;

    raceCards.forEach((card) => {
      const raceDate = card.getAttribute("data-date");
      const raceCounty = card.getAttribute("data-county");
      const raceDistances = card.getAttribute("data-distance");
      const raceTypeAttr = card.getAttribute("data-race-type");

      let show = true;

      if (fromDate && raceDate < fromDate) show = false;
      if (toDate && raceDate > toDate) show = false;
      if (county && raceCounty !== county) show = false;
      if (raceType && raceTypeAttr !== raceType) show = false;

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

    // After applying filters
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
    applyFilters();
  });
  dateTo.addEventListener("change", function() {
    applyFilters();
  });
  countyFilter.addEventListener("change", function() {
    applyFilters();
    if (preselectedFilters) checkFilters(); // Check filters after applying
  });
  raceTypeFilter.addEventListener("change", function() {
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
});