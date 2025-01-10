import { predictRaceTime, formatTime } from './predictRaceTime.js';

// Define common race distances using config values
const commonDistances = [
  { km: 1.60934, name: '1 Mile' },
  { km: 3.21868, name: '2 Mile' },
  { km: 3, name: '3K' },
  { km: 5, name: '5K' },
  { km: 10, name: '10K' },
  { km: 15, name: '15K' },
  {
    km: 21.0975,
    name: 'Halvmaraton',
  },
  { km: 42.195, name: 'Maraton' },
];

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

async function calculatePredictions(event) {
  if (event) {
    event.preventDefault();
  }
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

  // Get predictions - now with await
  const predictions = await predictRaceTime(distance, totalSeconds, isHilly);
  console.log('Raw predictions:', predictions);

  // Get results container and body
  const resultsContainer = document.querySelector('.results-container');
  const resultsBody = document.getElementById('results-body');

  // Clear previous results
  resultsBody.innerHTML = '';

  // Add new results
  predictions
    .filter((pred) =>
      commonDistances.some((d) => Math.abs(d.km - pred.distance) < 0.01)
    )
    .forEach((pred) => {
      const row = document.createElement('tr');
      if (isHilly) {
        row.innerHTML = `
          <td>${pred.name}</td>
          <td>${pred.time}</td>
          <td>${formatPace(pred.pace)}</td>
          <td>${formatPaceMile(pred.pace)}</td>
        `;
      } else {
        row.innerHTML = `
          <td>${pred.name}</td>
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

// Update event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');

  const calculateButton = document.getElementById('calculate-button');
  const isHillyCheckbox = document.getElementById('is-hilly');

  if (calculateButton) {
    calculateButton.addEventListener('click', (e) => calculatePredictions(e));
  }

  if (isHillyCheckbox) {
    isHillyCheckbox.addEventListener('change', (e) => calculatePredictions(e));
  }
});

// Add a helper function to format distance
function formatDistance(km) {
  const commonDistance = commonDistances.find(
    (d) => Math.abs(d.km - km) < 0.01
  );
  if (commonDistance) {
    return commonDistance.name;
  }
  return `${km.toFixed(1)}km`;
}