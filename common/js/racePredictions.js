import { predictRaceTime, formatTime } from './predictRaceTime.js';

console.log('Imported functions:', { predictRaceTime, formatTime });

function formatPace(paceSeconds) {
  if (isNaN(paceSeconds)) {
    console.error('Invalid pace seconds:', paceSeconds);
    return 'N/A';
  }
  // Format pace as min:sec per km
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatPaceMile(paceSeconds) {
  // Convert pace from per km to per mile and format
  const pacePerMile = paceSeconds * 1.60934;
  const minutes = Math.floor(pacePerMile / 60);
  const seconds = Math.floor(pacePerMile % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

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

  // Get hilly checkbox value
  const isHilly = document.getElementById('is-hilly').checked;

  console.log('Input values:', {
    distance,
    totalSeconds,
    isHilly,
    rawValues: {
      hours,
      minutes,
      seconds,
      distanceRaw: distanceSelect.value,
    },
  });

  // Get predictions
  const predictions = predictRaceTime(distance, totalSeconds, isHilly);
  console.log('Raw predictions:', predictions); // Debug log

  // Get results container and body
  const resultsContainer = document.querySelector('.results-container');
  const resultsBody = document.getElementById('results-body');

  // Clear previous results
  resultsBody.innerHTML = '';

  // Add new results
  predictions.forEach((pred) => {
    const row = document.createElement('tr');
    if (isHilly) {
      row.innerHTML = `
                <td>${pred.distance} km</td>
                <td>${pred.time}</td>
                <td>${formatPace(pred.pace)}</td>
                <td>${formatPaceMile(pred.pace)}</td>
                <td>${pred.flatTime}</td>
                <td>${formatPace(pred.flatPace)}</td>
                <td>${formatPaceMile(pred.flatPace)}</td>
                <td>+${Math.round(pred.hillAdjustment)}s/km</td>
            `;
    } else {
      row.innerHTML = `
                <td>${pred.distance} km</td>
                <td>${pred.time}</td>
                <td>${formatPace(pred.pace)}</td>
                <td>${formatPaceMile(pred.pace)}</td>
            `;
    }
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
