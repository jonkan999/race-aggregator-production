document.addEventListener("DOMContentLoaded", function () {
  const distanceMapping = {{ distance_filter.distance_mapping | tojson | safe }};
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
  const dateRangeFrom = "{{ section_race_card_header_date_range_from }}";
  const dateRangeTo = "{{ section_race_card_header_date_range_to }}";
  const dateRangeSingle = "{{ section_race_card_header_date_range_single }}";

  const categoryMapping = {{ category_mapping | tojson | safe }};

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
      if (activeCategories.has(category)) {
        activeCategories.delete(category);
        this.classList.remove("active");
      } else {
        activeCategories.add(category);
        this.classList.add("active");
      }
      applyFilters();
    });
  });

  const monthButtons = document.querySelectorAll(".month-button");
  let activeMonth = null;

  // Add event listeners to month buttons
  monthButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const month = this.getAttribute("data-month");
      if (activeMonth === month) {
        activeMonth = null;
        this.classList.remove("active");
        resetDateRange();
      } else {
        monthButtons.forEach((btn) => btn.classList.remove("active"));
        activeMonth = month;
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
    eventRange.textContent = `${start}-${end} of ${filteredCards.length} Events`;
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
      if (activeCategories.size > 0) {
        const distances = raceDistances ? raceDistances.split(', ') : [];
        
        const matchesActiveCategory = Array.from(activeCategories).some(category => 
          // Check if any of the race's distances map to the active category
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
  dateFrom.addEventListener("change", applyFilters);
  dateTo.addEventListener("change", applyFilters);
  countyFilter.addEventListener("change", applyFilters);
  raceTypeFilter.addEventListener("change", applyFilters);

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
});
