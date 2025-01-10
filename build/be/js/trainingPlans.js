import { exportToPDF } from './pdfExport.js';

// Training plan translations
const translations = {
  plan_variation: {
    focus_label: 'Fokus',
    weekly_structure_label:
      'Wekelijkse structuur',
    distribution_label:
      'Verdeling',
    sessions_per_week: 'sessies per week',
    select_button: 'Kies dit plan',
  },
  messages: {
    week_label: 'Week',
    weeks: 'weken',
    hilly_terrain_note: 'aangepast voor heuvelachtig terrein',
  },
  errors: {
    required_fields: 'Gelieve alle verplichte velden in te vullen',
    no_matching_plan: 'Geen overeenkomend trainingsplan gevonden',
    no_matching_variations:
      'Geen overeenkomende variaties gevonden',
    invalid_training_days: 'Het aantal trainingsdagen komt niet overeen met de eisen van het plan',
    loading_plans: 'Fout bij het laden van trainingsprogramma',
  },
  workout_components: {
    warmup_label: 'Opwarming',
    main_workout_label:
      'Trainingsbeschrijving',
    cooldown_label: 'Afkoeling',
    intensity_label: 'Tempo',
    duration_label: 'Duur',
  },
  weekdays: {
    monday: 'Maandag',
    tuesday: 'Dinsdag',
    wednesday: 'Woensdag',
    thursday: 'Donderdag',
    friday: 'Vrijdag',
    saturday: 'Zaterdag',
    sunday: 'Zondag',
  },
};

const countryCodeLanguageCode = 'nl';
let trainingPlans = null;

// Core Functions
async function loadTrainingPlans() {
  try {
    const response = await fetch(
      `/json/training_plans_processed_${countryCodeLanguageCode}.json`
    );
    trainingPlans = await response.json();
  } catch (error) {
    console.error(translations.errors.loading_plans, error);
  }
}

async function generateTrainingPlan() {
  const inputs = {
    targetDistance: document.getElementById('target-distance').value,
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

  if (!inputs.targetDistance || !inputs.raceDate) {
    alert(translations.errors.required_fields);
    return;
  }

  const experienceLevel = calculateExperienceLevel(inputs);
  console.log(experienceLevel);
  const weeksUntilRace = Math.floor(
    calculateDaysUntilRace(inputs.raceDate) / 7
  );

  // Find matching plan
  const matchingPlan = findMatchingPlan(trainingPlans.plans, {
    targetDistance: inputs.targetDistance,
    experienceLevel,
    weeksUntilRace,
    trainingDays: inputs.trainingDays,
  });

  if (!matchingPlan) {
    alert(translations.errors.no_matching_plan);
    return;
  }

  const paces = calculatePaces(
    inputs.targetTime,
    parseInt(inputs.targetDistance)
  );

  document.querySelector('.results-container').classList.remove('hidden');
  document.querySelector('.selected-plan').classList.remove('hidden');

  generateSpecificPlan(matchingPlan, inputs, paces);
}

const DISTANCE_MAPPINGS = {
  5000: '5k',
  10000: '10k',
  21097: 'half_marathon',
  42195: 'marathon',
};

function findMatchingPlan(plans, criteria) {
  // Search through all plans
  for (const plan of Object.values(plans)) {
    for (const variation of plan.variations) {
      const planWeeks = variation.variation.main_weeks.length;
      const weeklySessionCount =
        variation.variation.main_weeks[0].sessions.filter(
          (s) => s.workout !== 'Vila' && s.workout !== 'Rest'
        ).length;

      const matches = {
        weeks: Math.abs(planWeeks - criteria.weeksUntilRace) === 0,
        sessions: weeklySessionCount <= criteria.trainingDays,
        distance:
          plan.user_inputs?.target_distance ===
          DISTANCE_MAPPINGS[criteria.targetDistance],
        experience:
          plan.user_inputs?.experience_level === criteria.experienceLevel,
      };
      console.log(`planWeeks: ${planWeeks}`);
      console.log(`weeksUntilRace: ${criteria.weeksUntilRace}`);
      console.log(`weeklySessionCount: ${weeklySessionCount}`);
      console.log(`trainingDays: ${criteria.trainingDays}`);

      if (matches.weeks && matches.distance && matches.experience) {
        return variation;
      }
    }
  }

  return null;
}

// Helper Functions
function calculateExperienceLevel(inputs) {
  const targetPaceMinKm = calculateTargetPace(
    inputs.targetTime,
    inputs.targetDistance
  );

  const paceThresholds = {
    5000: { beginner: 6.5, intermediate: 5.0, advanced: 4.0 }, // 32:30, 25:00, 20:00
    10000: { beginner: 7.0, intermediate: 5.2, advanced: 4.2 }, // 1:10:00, 52:00, 42:00
    21097: { beginner: 7.2, intermediate: 5.5, advanced: 4.5 }, // 2:31:42, 1:56:02, 1:34:56
    42195: { beginner: 7.5, intermediate: 5.7, advanced: 4.7 }, // 5:16:28, 4:00:15, 3:18:31
  };

  const distances = Object.keys(paceThresholds).map(Number);
  const closestDistance = distances.reduce((prev, curr) => {
    return Math.abs(curr - inputs.targetDistance) <
      Math.abs(prev - inputs.targetDistance)
      ? curr
      : prev;
  });

  const thresholds = paceThresholds[closestDistance];

  if (targetPaceMinKm >= thresholds.beginner) return 'beginner';
  if (targetPaceMinKm >= thresholds.intermediate) return 'intermediate';
  if (targetPaceMinKm >= thresholds.advanced) return 'intermediate';
  return 'advanced';
}

function calculateTargetPace(targetTime, distance) {
  const totalMinutes =
    targetTime.hours * 60 + targetTime.minutes + targetTime.seconds / 60;
  return totalMinutes / (distance / 1000);
}

function calculateDaysUntilRace(raceDate) {
  const today = new Date();
  const race = new Date(raceDate);
  const diffTime = Math.abs(race - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// UI Generation Functions
function generateSpecificPlan(variation, inputs, paces) {
  const variationData = variation.variation;
  const scheduleContainer = document.getElementById('training-schedule');
  scheduleContainer.innerHTML = '';

  const overviewContainer = createPlanOverview(variationData, inputs, paces);
  scheduleContainer.appendChild(overviewContainer);

  variationData.main_weeks.forEach((week) => {
    const weekContainer = createWeekContainer(week, paces);
    scheduleContainer.appendChild(weekContainer);
  });
}

function createPlanOverview(variationData, inputs, paces) {
  const container = document.createElement('div');
  container.className = 'plan-overview';

  container.innerHTML = `
    <h3>${variationData.title}</h3>
    <div class="plan-focus">
      <strong>${translations.plan_variation.focus_label}:</strong> 
      ${variationData.focus}
    </div>
    <div class="plan-description">
      ${variationData.description}
    </div>
    <div class="plan-highlights">
      <ul>
        ${variationData.highlights
          .map((highlight) => `<li>${highlight}</li>`)
          .join('')}
      </ul>
    </div>
    <div class="plan-structure">
      <strong>${translations.plan_variation.weekly_structure_label}:</strong>
      ${variationData.main_weeks.length} ${translations.messages.weeks}
    </div>
    <div class="plan-distribution">
      <strong>${translations.plan_variation.distribution_label}:</strong>
      ${variationData.main_weeks[0].sessions.length} ${
    translations.plan_variation.sessions_per_week
  }
    </div>
    ${
      inputs.isHilly
        ? `<div class="terrain-note">${translations.messages.hilly_terrain_note}</div>`
        : ''
    }
  `;

  return container;
}

function createWeekContainer(week, paces) {
  const container = document.createElement('div');
  container.className = 'week-container';

  // Add week header with focus
  const header = document.createElement('div');
  header.className = 'week-header';
  header.innerHTML = `
    <h4>${translations.messages.week_label} ${week.week}</h4>
    <div class="week-focus">${week.focus}</div>
  `;
  container.appendChild(header);

  // Add sessions container
  const sessionsContainer = document.createElement('div');
  sessionsContainer.className = 'sessions-container';

  // Add each session
  week.sessions.forEach((session) => {
    const sessionElement = document.createElement('div');
    sessionElement.className = 'session';

    const pace = paces[session.intensity] || '';

    sessionElement.innerHTML = `
      <div class="session-header">
        <strong>${translations.weekdays[session.day.toLowerCase()]}:</strong> ${
      session.workout
    }
      </div>
      <div class="session-details">
        <p>${session.description}</p>
        <ul class="workout-specs">
          <li><strong>Duration:</strong> ${session.duration} ${
      session.duration_unit
    }</li>
          ${pace ? `<li><strong>Pace:</strong> ${pace}</li>` : ''}
        </ul>
      </div>
    `;

    sessionsContainer.appendChild(sessionElement);
  });

  container.appendChild(sessionsContainer);
  return container;
}
// Test environment setup
function setupTestEnvironment() {
  console.log('Setting up test environment...');

  // Calculate race date 12 weeks ahead on a Saturday
  const today = new Date();
  const raceDate = new Date(today);
  raceDate.setDate(today.getDate() + 12 * 7);

  // Adjust to next Saturday
  const daysUntilSaturday = (6 - raceDate.getDay() + 7) % 7;
  raceDate.setDate(raceDate.getDate() + daysUntilSaturday);

  // Format date as YYYY-MM-DD
  const raceDateString = raceDate.toISOString().split('T')[0];

  // Default test values
  const testInputs = {
    'race-date': raceDateString, // Changed from raceDate to race-date to match HTML id
    'target-distance': '42195', // Changed from targetDistance to target-distance to match HTML id
    hours: '4',
    minutes: '0',
    seconds: '0',
    'training-days': '5', // Changed from trainingDays to training-days to match HTML id
    'session-time': '60-90', // Changed from sessionTime to session-time to match HTML id
    'is-hilly': false,
  };

  // Fill form with test values
  Object.entries(testInputs).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`Setting ${id} to ${value}`);
      if (element.type === 'checkbox') {
        element.checked = value;
      } else if (element.type === 'select-one') {
        // For select elements, ensure the option exists
        const option = Array.from(element.options).find(
          (opt) => opt.value === value
        );
        if (option) {
          element.value = value;
        }
      } else {
        element.value = value;
      }
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  });

  // Verify the values were set
  Object.entries(testInputs).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`${id} value is: ${element.value}`);
    }
  });

  // Auto-generate plan after ensuring fields are populated
  setTimeout(() => {
    const generateButton = document.getElementById('generate-plan');
    if (generateButton) {
      console.log('Triggering plan generation');
      generateButton.click();
    } else {
      console.warn('Generate button not found');
    }
  }, 1);
}

// Modified initialize function
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing training plans...');

  // Wait for training plans to load
  await loadTrainingPlans();
  console.log('Training plans loaded:', trainingPlans ? 'success' : 'failed');

  // Set minimum date for race date input
  const raceDateInput = document.getElementById('race-date');
  if (raceDateInput) {
    const today = new Date();
    raceDateInput.min = today.toISOString().split('T')[0];
  }

  // Set up event listeners
  const generateButton = document.getElementById('generate-plan');
  if (generateButton) {
    generateButton.addEventListener('click', (e) => {
      e.preventDefault();
      generateTrainingPlan();
    });
  }

  const regenerateButton = document.getElementById('regenerate-plan');
  if (regenerateButton) {
    regenerateButton.addEventListener('click', generateTrainingPlan);
  }

  // Initialize form with default values
  setupTestEnvironment();
});

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
      INTERVAL_PACE: -0.1, // 6s/km faster
      RECOVERY_PACE: 1.0, // 60s/km slower
    },
    10000: {
      // 10K
      EASY_PACE: 1.1,
      LONG_PACE: 0.75,
      TEMPO_PACE: -0.1,
      INTERVAL_PACE: -0.15,
      RECOVERY_PACE: 1.25,
    },
    21097: {
      // Half Marathon
      EASY_PACE: 1.0,
      LONG_PACE: 0.6,
      TEMPO_PACE: -0.2,
      INTERVAL_PACE: -0.4,
      RECOVERY_PACE: 1.35,
    },
    42195: {
      // Marathon
      EASY_PACE: 0.9,
      LONG_PACE: 0.5,
      TEMPO_PACE: -0.25,
      INTERVAL_PACE: -0.5,
      RECOVERY_PACE: 1.5,
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
    TEMPO_PACE: formatPace(goalPace + adjustments.TEMPO_PACE),
    INTERVAL_PACE: formatPace(goalPace + adjustments.INTERVAL_PACE),
    RECOVERY_PACE: formatPace(goalPace + adjustments.RECOVERY_PACE),
  };
}

function formatPace(pace) {
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Existing initialization code...

  // Add event listener for PDF export
  const exportButton = document.getElementById('export-pdf');
  if (exportButton) {
    exportButton.addEventListener('click', exportToPDF);
  }
});