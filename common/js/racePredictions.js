import { predictRaceTime, formatTime } from './race_predictor.js';

function calculatePredictions(event) {
  event.preventDefault();
  console.log('Calculating predictions...'); // Debug log

  // Get input values
  const distanceSelect = document.getElementById('known-distance');
  const distance = parseInt(distanceSelect.value) / 1000; // Convert to km

  const hours = parseInt(document.getElementById('hours').value) || 0;
  const minutes = parseInt(document.getElementById('minutes').value) || 0;
  const seconds = parseInt(document.getElementById('seconds').value) || 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  console.log('Inputs:', { distance, hours, minutes, seconds, totalSeconds }); // Debug log

  // Get predictions
  const predictions = predictRaceTime(distance, totalSeconds);
  console.log('Predictions:', predictions); // Debug log

  // Get results container and body
  const resultsContainer = document.querySelector('.results-container');
  const resultsBody = document.getElementById('results-body');

  // Clear previous results
  resultsBody.innerHTML = '';

  // Add new results
  predictions.forEach((pred) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${pred.distance} km</td>
            <td>${pred.time} (${formatTime(pred.pace)}/km)</td>
        `;
    resultsBody.appendChild(row);
  });

  // Show results
  resultsContainer.classList.remove('hidden');
}

// Add event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded'); // Debug log

  const calculateButton = document.getElementById('calculate-button');
  console.log('Button found:', calculateButton); // Debug log

  if (calculateButton) {
    calculateButton.addEventListener('click', calculatePredictions);
    console.log('Event listener added to button'); // Debug log
  } else {
    console.error('Calculate button not found');
  }
});
