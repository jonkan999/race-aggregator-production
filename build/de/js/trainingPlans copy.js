// Training plan translations
const translations = {
  plan_variation: {
    focus_label: 'Fokus',
    weekly_structure_label:
      'Wochenstruktur',
    distribution_label:
      'Verteilung',
    sessions_per_week: 'Pässe pro Woche',
    select_button: 'Wähle diesen Plan',
  },
  messages: {
    week_label: 'Woche',
    weeks: 'Wochen',
    hilly_terrain_note: 'angepasst für hügeliges Terrain',
  },
  errors: {
    required_fields: 'Bitte füllen Sie alle Pflichtfelder aus.',
    no_matching_plan: 'Keine passende Trainingsplanung gefunden',
    no_matching_variations:
      'Keine passenden Variationen gefunden',
    invalid_training_days: 'Die Anzahl der Trainingstage entspricht nicht den Anforderungen des Plans',
    loading_plans: 'Fehler beim Laden des Trainingsprogramms',
  },
  workout_components: {
    warmup_label: 'Aufwärmen',
    main_workout_label:
      'Passbeschreibung',
    cooldown_label: 'Abkühlung',
    intensity_label: 'Tempo',
    duration_label: 'Dauer',
  },
  weekdays: {
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
  },
};

// Training types with translations
const trainingTypes = {
  easy: 'Ruhiges Training',
  tempo: 'Tempotraining',
  intervals: 'Intervalltraining',
  long: 'Lange Einheit',
  rest: 'Ruhe',
};

// Add workout type translations
const workoutTypes = {
  recovery: '',
  easy: 'Ruhiges Training',
  tempo: 'Tempotraining',
  intervals: 'Intervalltraining',
  long: 'Lange Einheit',
};

// Load training plans from JSON
let trainingPlans = null;

async function loadTrainingPlans() {
  try {
    const response = await fetch(
      `/json/training_plans_de.json`
    );
    trainingPlans = await response.json();
  } catch (error) {
    console.error(translations.errors.loading_plans, error);
  }
}

function calculatePace(targetTime, distance) {
  const totalMinutes =
    targetTime.hours * 60 + targetTime.minutes + targetTime.seconds / 60;
  return totalMinutes / (distance / 1000);
}

async function generateTrainingPlan() {
  // Validate required fields
  const requiredFields = ['race-date', 'plan-type', 'target-distance'];
  const missingFields = requiredFields.filter(
    (field) => !document.getElementById(field).value
  );

  if (missingFields.length > 0) {
    alert(translations.errors.required_fields);
    return;
  }

  // Get user inputs
  const inputs = {
    planType: document.getElementById('plan-type').value,
    targetDistance: parseInt(document.getElementById('target-distance').value),
    targetTime: {
      hours: parseInt(document.getElementById('hours').value) || 0,
      minutes: parseInt(document.getElementById('minutes').value) || 0,
      seconds: parseInt(document.getElementById('seconds').value) || 0,
    },
    trainingDays: parseInt(document.getElementById('training-days').value),
    sessionTime: document.getElementById('session-time').value,
    isHilly: document.getElementById('is-hilly').checked,
    raceDate: document.getElementById('race-date').value,
  };

  // Calculate paces based on target time and distance
  const paces = calculatePaces(inputs.targetTime, inputs.targetDistance);

  // Find matching plan and variation
  const plan = trainingPlans.plans[inputs.planType];
  if (!plan) {
    alert(translations.errors.no_matching_plan);
    return;
  }

  const variation = plan.variations[0];
  if (!variation) {
    alert(translations.errors.no_matching_variations);
    return;
  }

  // Generate the specific plan with paces
  generateSpecificPlan(variation, inputs, paces);
}

function calculatePaces(targetTime, targetDistance) {
  // Calculate goal pace in min/km
  const totalMinutes =
    targetTime.hours * 60 + targetTime.minutes + targetTime.seconds / 60;
  const distanceInKm = targetDistance / 1000;
  const goalPace = totalMinutes / distanceInKm;

  // Define pace adjustments based on race distance
  const paceAdjustments = {
    5000: {
      // 5K
      EASY_PACE: 1.2, // 72s/km slower
      LONG_PACE: 0.85, // 51s/km slower
      TEMPO_PACE: 0, // Same as race pace
      INTERVAL_PACE: 0.1, // 6s/km faster
      RECOVERY_PACE: 1.0, // 60s/km slower
    },
    10000: {
      // 10K
      EASY_PACE: 1.1, // 66s/km slower
      LONG_PACE: 0.75, // 45s/km slower
      TEMPO_PACE: 0.1, // 6s/km faster
      INTERVAL_PACE: 0.15, // 9s/km faster
      RECOVERY_PACE: 1.25, // 75s/km slower
    },
    21097: {
      // Half Marathon
      EASY_PACE: 1, // 60s/km slower
      LONG_PACE: 0.6, // 36s/km slower
      TEMPO_PACE: 0.2, // 12s/km faster
      INTERVAL_PACE: 0.4, // 24s/km faster
      RECOVERY_PACE: 1.35, // 81s/km slower
    },
    42195: {
      // Marathon
      EASY_PACE: 0.9, // 54s/km slower
      LONG_PACE: 0.5, // 30s/km slower
      TEMPO_PACE: 0.25, // 15s/km faster
      INTERVAL_PACE: 0.5, // 30s/km faster
      RECOVERY_PACE: 1.5, // 90s/km slower
    },
  };

  // Find the closest matching distance
  const distances = Object.keys(paceAdjustments).map(Number);
  const closestDistance = distances.reduce((prev, curr) => {
    return Math.abs(curr - targetDistance) < Math.abs(prev - targetDistance)
      ? curr
      : prev;
  });

  const adjustments = paceAdjustments[closestDistance];

  // Calculate training paces based on goal pace and distance-specific adjustments
  return {
    EASY_PACE: formatPace(goalPace + adjustments.EASY_PACE),
    LONG_PACE: formatPace(goalPace + adjustments.LONG_PACE),
    TEMPO_PACE: formatPace(goalPace - adjustments.TEMPO_PACE),
    INTERVAL_PACE: formatPace(goalPace - adjustments.INTERVAL_PACE),
    RECOVERY_PACE: formatPace(goalPace + adjustments.RECOVERY_PACE),
  };
}

function formatPace(pace) {
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

function adjustForTerrain(pace, isHilly) {
  if (!isHilly) return pace;
  return pace + 15; // Add 15 sec/km for hills
}

// Define training phases
const phases = {
  base: {
    recovery: 0.3, // 30% of sessions
    easy: 0.4, // 40% of sessions
    tempo: 0.2, // 20% of sessions
    intervals: 0.1, // 10% of sessions
  },
  build: {
    recovery: 0.2,
    easy: 0.3,
    tempo: 0.3,
    intervals: 0.2,
  },
  peak: {
    recovery: 0.2,
    easy: 0.2,
    tempo: 0.3,
    intervals: 0.3,
  },
  taper: {
    recovery: 0.4,
    easy: 0.3,
    tempo: 0.2,
    intervals: 0.1,
  },
};

function generateSpecificPlan(variation, inputs, paces) {
  const variationData = variation.variation;
  const totalWeeks = Math.floor(calculateDaysUntilRace(inputs.raceDate) / 7);
  const weeklyDistance = calculateWeeklyDistance(variation, paces);

  // Show results and selected plan
  document.querySelector('.results-container').classList.remove('hidden');
  document.querySelector('.selected-plan').classList.remove('hidden');

  // Create plan overview section
  const overviewContainer = document.createElement('div');
  overviewContainer.className = 'plan-overview';
  overviewContainer.innerHTML = `
    <h2>${variationData.title}</h2>
    <div class="overview-metrics">
      <div class="overview-item">
        <span class="label">Programlängd:</span>
        <span id="plan-duration">${totalWeeks} ${
    translations.messages.weeks
  }</span>
      </div>
      <div class="overview-item">
        <span class="label">Veckodistans:</span>
        <span id="weekly-distance">~${weeklyDistance} km</span>
      </div>
    </div>
    <div class="plan-focus">
      <h3>Fokus</h3>
      <p>${variationData.focus}</p>
    </div>
    <div class="plan-description">
      <h3>Beskrivning</h3>
      <p>${variationData.description}</p>
    </div>
    <div class="plan-highlights">
      <h3>Viktiga punkter</h3>
      <ul>
        ${variationData.highlights
          .map((highlight) => `<li>${highlight}</li>`)
          .join('')}
      </ul>
    </div>
    <div class="session-types">
      <h3>Passtyper</h3>
      ${Object.entries(variationData.weekly_structure.session_types)
        .map(
          ([type, details]) => `
          <div class="session-type">
            <h4>${workoutTypes[type] || type}</h4>
            <p>${details.description}</p>
            <p>Intensitet: ${
              paces[details.intensity.split(' ')[0]] || details.intensity
            }</p>
            <p>Tid: ${details.duration_range.min}-${
            details.duration_range.max
          } ${details.duration_range.unit}</p>
          </div>
        `
        )
        .join('')}
    </div>
  `;

  // Insert overview at the top of the schedule container
  const scheduleContainer = document.getElementById('training-schedule');
  scheduleContainer.innerHTML = '';
  scheduleContainer.appendChild(overviewContainer);

  // Rest of the existing code remains unchanged...
  let currentWeek = 1;
  const phases = variationData.phases;
  if (!phases || !Array.isArray(phases)) {
    console.error('Invalid phases data:', phases);
    return;
  }

  phases.forEach((phase) => {
    const phaseWeeks = parseInt(phase.duration_weeks.split('-')[0]);

    for (let week = 0; week < phaseWeeks; week++) {
      const weekContainer = createWeekContainer(currentWeek);

      Object.entries(phase.weekly_template).forEach(([day, session]) => {
        const sessionElement = createSessionElement(
          day,
          session,
          variationData.weekly_structure.session_types,
          variationData,
          paces
        );
        weekContainer.appendChild(sessionElement);
      });

      scheduleContainer.appendChild(weekContainer);
      currentWeek++;
    }
  });
}
function createSessionElement(
  day,
  session,
  sessionTypes,
  variationData,
  paces
) {
  const sessionType = sessionTypes[session.type];
  const element = document.createElement('div');
  element.className = 'training-session';

  // Get the detailed instructions for this session type
  const instructions =
    variationData.weekly_structure.instructions[session.type];

  // Get the appropriate pace for this session type
  const pace =
    paces[`${session.type.toUpperCase()}_PACE`] ||
    paces[session.intensity] ||
    'Anpassat tempo';

  element.innerHTML = `
    <h4>${translations.weekdays[day.toLowerCase()]}</h4>
    <div class="workout-details">
      <div class="workout-type">${workoutTypes[session.type] || 'Löpning'}</div>
      <div class="workout-structure">
        <div class="warmup">
          <span class="label">${
            translations.workout_components.warmup_label
          }:</span>
          ${
            session.type === 'recovery'
              ? '10-15 min lugn jogg'
              : session.type === 'tempo' || session.type === 'intervals'
              ? '15-20 min progressiv uppvärmning'
              : '10-15 min lugn jogg'
          }
        </div>
        <div class="main-workout">
          <span class="label">${
            translations.workout_components.main_workout_label
          }:</span>
          ${instructions}
        </div>
        <div class="cooldown">
          <span class="label">${
            translations.workout_components.cooldown_label
          }:</span>
          ${
            session.type === 'recovery'
              ? '5-10 min lugn jogg'
              : session.type === 'tempo' || session.type === 'intervals'
              ? '10-15 min lugn jogg'
              : '5-10 min lugn jogg'
          }
        </div>
      </div>
      <div class="workout-intensity">
        ${translations.workout_components.intensity_label}: ${pace}
      </div>
      <div class="workout-duration">
        ${translations.workout_components.duration_label}: ${session.duration}
      </div>
    </div>
  `;

  return element;
}
function createVariationElement(variation, index) {
  const variationData = variation.variation;
  const element = document.createElement('div');
  element.className = 'plan-variation';

  element.innerHTML = `
    <h4>${variationData.title}</h4>
    <p>${variationData.focus}</p>
    <ul>
      <li>${translations.plan_variation.focus_label}: ${
    variationData.philosophy
  }</li>
      <li>${translations.plan_variation.weekly_structure_label}: 
        ${variationData.weekly_structure.sessions} ${
    translations.plan_variation.sessions_per_week
  }</li>
      <li>${translations.plan_variation.distribution_label}:
        <ul>
          ${Object.entries(variationData.weekly_structure.distribution)
            .map(
              ([type, count]) =>
                `<li>${trainingTypes[type.replace('_runs', '')]}: ${count}</li>`
            )
            .join('')}
        </ul>
      </li>
    </ul>
    <button class="btn btn--outline select-plan" data-variation="${index}">
      ${translations.plan_variation.select_button}
    </button>
  `;

  element.querySelector('.select-plan').addEventListener('click', () => {
    generateSpecificPlan(variation);
  });

  return element;
}
function createWeekContainer(weekNum) {
  const container = document.createElement('div');
  container.className = 'week-container';

  const header = document.createElement('div');
  header.className = 'week-header';
  header.textContent = `${translations.messages.week_label} ${weekNum}`;
  container.appendChild(header);

  return container;
}

function createDayElement(day, session) {
  const element = document.createElement('div');
  element.className = 'training-day';

  // Format pace for display
  const formatPace = (pace) => {
    if (!pace || pace < 0) return 'Anpassat tempo';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  element.innerHTML = `
    <div class="day-label">${day}</div>
    <div class="workout-details">
      <div class="workout-type">${workoutTypes[session.type] || 'Löpning'}</div>
      <div class="workout-structure">
        <div class="warmup">
          <span class="label">${
            translations.workout_components.warmup_label
          }:</span>
          ${session.structure.warmup}
        </div>
        <div class="main-workout">
          <span class="label">${
            translations.workout_components.main_workout_label
          }:</span>
          ${session.structure.main}
        </div>
        <div class="cooldown">
          <span class="label">${
            translations.workout_components.cooldown_label
          }:</span>
          ${session.structure.cooldown}
        </div>
      </div>
      <div class="workout-intensity">
        ${translations.workout_components.intensity_label}: ${formatPace(
    session.intensity
  )}
      </div>
      <div class="workout-duration">
        ${translations.workout_components.duration_label}: ${
    session.duration
  } minuter
      </div>
    </div>
  `;

  return element;
}
function updatePlanOverview(totalWeeks) {
  document.getElementById(
    'plan-duration'
  ).textContent = `${totalWeeks} ${translations.messages.weeks}`;
  document.querySelector('.selected-plan').classList.remove('hidden');
  document.querySelector('.plan-variations').classList.add('hidden');
}

// Add regeneration handler
document.getElementById('regenerate-plan')?.addEventListener('click', () => {
  document.querySelector('.selected-plan').classList.add('hidden');
  document.querySelector('.plan-variations').classList.remove('hidden');
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTrainingPlans();

  const generateButton = document.getElementById('generate-plan');
  if (generateButton) {
    generateButton.addEventListener('click', (e) => {
      e.preventDefault();
      generateTrainingPlan();
    });
  }
});

// Helper function to calculate days until race
function calculateDaysUntilRace(raceDate) {
  const today = new Date();
  const race = new Date(raceDate);
  const diffTime = Math.abs(race - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper function to calculate weekly distance
function calculateWeeklyDistance(variation, paces) {
  try {
    const weeklyTemplate = variation.variation.phases[0].weekly_template;
    let totalDistance = 0;

    Object.values(weeklyTemplate).forEach((session) => {
      // Get duration range and calculate average duration
      const [minDuration, maxDuration] = session.duration
        .split('-')
        .map((d) => parseInt(d));
      const avgDuration = (minDuration + maxDuration) / 2;

      // Get pace for session type
      const paceString = paces[`${session.type.toUpperCase()}_PACE`];
      if (paceString) {
        const [minutes, seconds] = paceString
          .split(':')[0]
          .split('.')
          .map((n) => parseInt(n));
        const paceInMinutes = minutes + (seconds || 0) / 60;

        // Calculate distance: time / pace
        const distance = avgDuration / paceInMinutes;
        totalDistance += distance;
      }
    });

    return Math.round(totalDistance);
  } catch (error) {
    console.error('Error calculating weekly distance:', error);
    return 0;
  }
}

// Add this at the bottom of your file
function setupTestEnvironment() {
  // Calculate race date 12 weeks ahead on a Saturday
  const today = new Date();
  const raceDate = new Date(today);
  raceDate.setDate(today.getDate() + 12 * 7); // Add 12 weeks

  // Adjust to next Saturday if needed
  const daysUntilSaturday = (6 - raceDate.getDay() + 7) % 7;
  raceDate.setDate(raceDate.getDate() + daysUntilSaturday);

  // Format date as YYYY-MM-DD
  const raceDateString = raceDate.toISOString().split('T')[0];

  const testInputs = {
    raceDate: raceDateString,
    planType: 'maraton',
    targetDistance: '42194',
    hours: '4',
    minutes: '0',
    seconds: '0',
    trainingDays: '5',
    sessionTime: '60-90',
    isHilly: false,
  };

  // Fill form
  document.getElementById('race-date').value = testInputs.raceDate;
  document.getElementById('plan-type').value = testInputs.planType;
  document.getElementById('target-distance').value = testInputs.targetDistance;
  document.getElementById('hours').value = testInputs.hours;
  document.getElementById('minutes').value = testInputs.minutes;
  document.getElementById('seconds').value = testInputs.seconds;
  document.getElementById('training-days').value = testInputs.trainingDays;
  document.getElementById('session-time').value = testInputs.sessionTime;
  document.getElementById('is-hilly').checked = testInputs.isHilly;

  // Trigger plan generation
  const generateButton = document.getElementById('generate-plan');
  if (generateButton) {
    generateButton.click();
  }
}
// Auto-run when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Setting up test environment...');
  setTimeout(setupTestEnvironment, 1000);
});

// You can also run it manually from console:
// setupTestEnvironment();