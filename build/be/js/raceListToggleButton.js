const toggleButton = document.getElementById('toggleMapButton');
const button = toggleButton.querySelector('button');
const offIcon = toggleButton.querySelector('#offIcon');
const onIcon = toggleButton.querySelector('#onIcon');
const toggleButtoMapSection = document.querySelector('.map-placeholder');
const toggleButtonRaceCardsSection = document.querySelector('.race-cards-grid');
const venueSelector = document.querySelector('.race-cards-selector');

let isToggled = true;

button.addEventListener('click', () => {
  isToggled = !isToggled;

  if (isToggled) {
    offIcon.style.display = 'none';
    onIcon.style.display = 'inline-block';
    toggleButtoMapSection.style.display = 'block';
    toggleButtonRaceCardsSection.style.gridTemplateColumns = 'repeat(3, 1fr)';
    venueSelector.style.margin = 'auto';
  } else {
    offIcon.style.display = 'inline-block';
    onIcon.style.display = 'none';
    toggleButtoMapSection.style.display = 'none';
    /* 1787 1436 */
    if (window.innerWidth > 1787) {
      toggleButtonRaceCardsSection.style.gridTemplateColumns = 'repeat(5, 1fr)';
    } else if (window.innerWidth > 1436) {
      toggleButtonRaceCardsSection.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
    venueSelector.style.justifyContent = 'center';
  }
});