// Training types with their translations from the template
const trainingTypes = {
  easy: 'Lugnt pass',
  tempo: 'Tempopass',
  intervals: 'Intervaller',
  long: 'Långpass',
  rest: 'Vila',
};

function calculateDaysUntilRace(raceDate) {
  const today = new Date();
  const race = new Date(raceDate);
  const diffTime = Math.abs(race - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function generateTrainingPlan() {
  // Get form values
  const raceDate = document.getElementById('race-date').value;
  const distance = parseInt(document.getElementById('target-distance').value);
  const trainingDays = parseInt(document.getElementById('training-days').value);
  const isHilly = document.getElementById('is-hilly').checked;

  // Show results container first
  const resultsContainer = document.querySelector('.results-container');
  if (resultsContainer) {
    resultsContainer.classList.remove('hidden');
  }

  // Update overview elements with null checks
  const daysUntil = calculateDaysUntilRace(raceDate);
  const daysElement = document.getElementById('days-until-race');
  if (daysElement) {
    daysElement.textContent = `${daysUntil} dagar`;
  }

  // Calculate number of weeks (rounded down to full weeks)
  const weeks = Math.floor(daysUntil / 7);
  const durationElement = document.getElementById('plan-duration');
  if (durationElement) {
    durationElement.textContent = `${weeks} veckor`;
  }

  // Mock weekly distance calculation
  const baseDistance = distance / 1000; // Convert to km
  const weeklyDistance = Math.round(baseDistance * 1.5);
  const distanceElement = document.getElementById('weekly-distance');
  if (distanceElement) {
    distanceElement.textContent = `~${weeklyDistance} km`;
  }

  // Generate weekly schedule
  const scheduleContainer = document.getElementById('training-schedule');
  if (scheduleContainer) {
    scheduleContainer.innerHTML = ''; // Clear existing schedule

    for (let week = 1; week <= weeks; week++) {
      const weekContainer = document.createElement('div');
      weekContainer.className = 'week-container';

      // Week header
      const weekHeader = document.createElement('div');
      weekHeader.className = 'week-header';
      weekHeader.textContent = `Vecka ${week}`;
      weekContainer.appendChild(weekHeader);

      // Generate days
      for (let day = 1; day <= 7; day++) {
        if (day <= trainingDays) {
          const workout = generateWorkout(week, day, distance);
          const dayElement = createDayElement(day, workout);
          weekContainer.appendChild(dayElement);
        }
      }

      scheduleContainer.appendChild(weekContainer);
    }
  }
}

function generateWorkout(week, day, distance) {
  // Mock workout generation based on day of week
  switch (day) {
    case 1:
      return {
        type: trainingTypes.easy,
        description: '45 min lugnt tempo',
      };
    case 2:
      return {
        type: trainingTypes.intervals,
        description: '8x400m med 2 min vila',
      };
    case 3:
      return {
        type: trainingTypes.tempo,
        description: '30 min tempokörning',
      };
    case 4:
      return {
        type: trainingTypes.long,
        description: '90 min långpass',
      };
    default:
      return {
        type: trainingTypes.easy,
        description: '40 min återhämtning',
      };
  }
}

function createDayElement(day, workout) {
  const dayElement = document.createElement('div');
  dayElement.className = 'training-day';

  const dayLabel = document.createElement('div');
  dayLabel.className = 'day-label';
  dayLabel.textContent = `Dag ${day}`;

  const workoutDetails = document.createElement('div');
  workoutDetails.className = 'workout-details';
  workoutDetails.innerHTML = `
        <div class="workout-type">${workout.type}</div>
        <div class="workout-description">${workout.description}</div>
    `;

  dayElement.appendChild(dayLabel);
  dayElement.appendChild(workoutDetails);
  return dayElement;
}

// Add validation to form submission
document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('generate-plan');
  const form = document.getElementById('training-calculator');

  if (generateButton && form) {
    generateButton.addEventListener('click', (e) => {
      e.preventDefault();

      // Check if date is selected
      const raceDate = document.getElementById('race-date').value;
      if (!raceDate) {
        alert('Vänligen välj ett datum'); // Add this to your translations
        return;
      }

      generateTrainingPlan();
    });
  }
});