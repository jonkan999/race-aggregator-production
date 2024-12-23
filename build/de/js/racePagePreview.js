import { loadRacePageContent } from './racePageContent.js';
import { submitRace } from './submitRace.js';

document.addEventListener('DOMContentLoaded', () => {
  const editRaceButton = document.getElementById('edit-race');
  const submitRaceButton = document.getElementById('submit-race-button');
  const aiDisclaimer = document.getElementById('ai-disclaimer');
  aiDisclaimer.style.display = 'none';
  loadRacePageContent();

  editRaceButton.addEventListener('click', () => {
    window.location.href = `/lauf-hinzufuegen.html`;
  });

  submitRaceButton.addEventListener('click', (e) => {
    e.preventDefault();
    submitRace();
  });
});