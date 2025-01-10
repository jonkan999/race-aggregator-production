// Get reference to the map toggle button
const toggleButtonMobile = document.getElementById('toggleMapButtonMobile');

// Check if we're in a subfolder of race-list
const currentPath = window.location.pathname;
const baseRaceListPath = '/{{ navigation['race-list'] | slugify(country_code) }}';

// If we're in a subfolder, add redirect behavior to map button
if (
  currentPath !== baseRaceListPath &&
  currentPath !== baseRaceListPath + '/' &&
  currentPath.startsWith(baseRaceListPath + '/')
) {
  toggleButtonMobile.addEventListener('click', function () {
    // Get current filter values from data attributes
    const raceCardsContainer = document.getElementById('race-cards-container');
    const preselectedFilters = raceCardsContainer
      ? JSON.parse(
          raceCardsContainer.getAttribute('data-preselected-filters') || '{}'
        )
      : {};

    // Construct query parameters
    const queryParams = new URLSearchParams();

    // Add filters if they exist, using empty string for null values
    queryParams.set('category', preselectedFilters.category || 'all');
    queryParams.set('county', preselectedFilters.county || '');
    queryParams.set('race_type', preselectedFilters.race_type || '');

    // Add map parameter
    queryParams.set('map', 'true');

    // Debug output
    console.log('Query params:', queryParams.toString());
    const redirectUrl = `${baseRaceListPath}/?${queryParams.toString()}`;
    console.log('Redirect URL:', redirectUrl);

    // Add delay to see logs
    window.location.href = redirectUrl;
  });
}
