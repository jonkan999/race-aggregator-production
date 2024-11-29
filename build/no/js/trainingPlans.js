// Training plan translations
const translations = {
  plan_variation: {
    focus_label: 'Fokus',
    weekly_structure_label:
      'Ukestruktur',
    distribution_label:
      'Fordeling',
    sessions_per_week: 'økter per uke',
    select_button: 'Velg denne planen',
  },
  messages: {
    week_label: 'Uke',
    weeks: 'uker',
    hilly_terrain_note: 'tilpasset for kupert terreng',
  },
  errors: {
    required_fields: 'Vennligst fyll ut alle obligatoriske felt',
    no_matching_plan: 'Ingen matchende treningsplan ble funnet',
    no_matching_variations:
      'Ingen matchende varianter ble funnet',
    invalid_training_days: 'Antall treningsdager samsvarer ikke med planens krav',
    loading_plans: 'Feil ved lasting av treningsprogram',
  },
  workout_components: {
    warmup_label: 'Oppvarming',
    main_workout_label:
      'Øktbeskrivelse',
    cooldown_label: 'Nedjogging',
    intensity_label: 'Tempo',
    duration_label: 'Tid',
  },
  weekdays: {
    monday: 'Mandag',
    tuesday: 'Tirsdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lørdag',
    sunday: 'Søndag',
  },
};

// Training types with translations
const trainingTypes = {
  easy: 'Rolig økt',
  tempo: 'Tempoøkt',
  intervals: 'Intervaller',
  long: 'Langtur',
  rest: 'Hvile',
};

// Add workout type translations
const workoutTypes = {
  recovery: '',
  easy: 'Rolig økt',
  tempo: 'Tempoøkt',
  intervals: 'Intervaller',
  long: 'Langtur',
};

// Load training plans from JSON
let trainingPlans = null;

async function loadTrainingPlans() {
  try {
    const response = await fetch(
      `/json/training_plans_no.json`
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

function calculateExperienceLevel(inputs) {
  // Calculate experience level based on target time and previous experience
  const targetPaceMinKm = calculatePace(
    inputs.targetTime,
    inputs.targetDistance
  );

  // Pace thresholds in minutes per kilometer for different distances
  const paceThresholds = {
    5000: {
      // 5K
      beginner: 7.0,
      intermediate: 5.5,
    },
    10000: {
      // 10K
      beginner: 7.5,
      intermediate: 6.0,
    },
    21097: {
      // Half Marathon
      beginner: 8.0,
      intermediate: 6.5,
    },
    42195: {
      // Marathon
      beginner: 8.5,
      intermediate: 7.0,
    },
  };

  // Find closest distance threshold
  const distances = Object.keys(paceThresholds).map(Number);
  const closestDistance = distances.reduce((prev, curr) => {
    return Math.abs(curr - inputs.targetDistance) <
      Math.abs(prev - inputs.targetDistance)
      ? curr
      : prev;
  });

  const thresholds = paceThresholds[closestDistance];

  if (targetPaceMinKm > thresholds.beginner) {
    return 'beginner';
  } else if (targetPaceMinKm > thresholds.intermediate) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

function getPlanType(experienceLevel, targetDistance) {
  const distanceMap = {
    42195: 'maraton',
    21097: 'halvmaraton',
    10000: '10k',
    5000: '5k',
  };

  // Find closest matching distance
  const distances = Object.keys(distanceMap).map(Number);
  const closestDistance = distances.reduce((prev, curr) => {
    return Math.abs(curr - targetDistance) < Math.abs(prev - targetDistance)
      ? curr
      : prev;
  });

  // Changed to match your JSON structure (e.g., "maraton_nybörjare")
  return `${distanceMap[closestDistance]}_${translateExperienceLevel(
    experienceLevel
  )}`;
}

// New helper function to translate experience levels to Swedish
function translateExperienceLevel(level) {
  const translations = {
    beginner: 'nybörjare',
    intermediate: 'erfaren', // Changed from 'intermediate'
    advanced: 'avancerad', // Changed from 'advanced'
  };
  return translations[level] || level;
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

  const experienceLevel = calculateExperienceLevel(inputs);
  const planType = getPlanType(experienceLevel, inputs.targetDistance);

  // Add debug logging
  console.log('Calculated experience level:', experienceLevel);
  console.log('Generated plan type:', planType);
  console.log('Available plans:', Object.keys(trainingPlans.plans));

  // Calculate weeks until race
  const weeksUntilRace = Math.floor(
    calculateDaysUntilRace(inputs.raceDate) / 7
  );

  // Find matching plan
  const plan = trainingPlans.plans[planType];
  if (!plan) {
    console.error('No matching plan found for type:', planType);
    alert(translations.errors.no_matching_plan);
    return;
  }

  // Get first variation
  const variation = plan.variations[0];
  if (!variation) {
    alert(translations.errors.no_matching_variations);
    return;
  }

  // Adjust weeks based on time until race
  let weeks = variation.variation.main_weeks;
  if (weeksUntilRace < 8) {
    // Keep weeks 1, 2, 3 and 8, remove others
    weeks = [weeks[0], weeks[1], weeks[2], weeks[7]];
  } else if (weeksUntilRace > 8) {
    // Interpolate middle weeks (4 and 5) until desired length
    const middleWeeks = [weeks[3], weeks[4]];
    const extraWeeksNeeded = weeksUntilRace - 8;
    const interpolatedWeeks = [];

    for (let i = 0; i < extraWeeksNeeded; i++) {
      interpolatedWeeks.push({
        ...middleWeeks[i % 2],
        week: i + 4, // Adjust week number
      });
    }

    weeks = [...weeks.slice(0, 3), ...interpolatedWeeks, ...weeks.slice(5)];
  }

  // Update variation with adjusted weeks
  variation.variation.main_weeks = weeks;

  // Calculate paces based on target time and distance
  const paces = calculatePaces(inputs.targetTime, inputs.targetDistance);

  // Generate the specific plan
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
  const scheduleContainer = document.getElementById('training-schedule');
  scheduleContainer.innerHTML = '';

  // Create plan overview
  const overviewContainer = document.createElement('div');
  overviewContainer.className = 'plan-overview';
  overviewContainer.innerHTML = `
    <h2>${variationData.title}</h2>
    <div class="plan-focus">
      <h3>Fokus</h3>
      <p>${variationData.focus}</p>
    </div>
    <div class="plan-description">
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
  `;
  scheduleContainer.appendChild(overviewContainer);

  // Generate weekly schedule
  variationData.main_weeks.forEach((week) => {
    const weekContainer = createWeekContainer(week.week);

    week.sessions.forEach((session) => {
      const sessionElement = createSessionElement(session.day, session, paces);
      weekContainer.appendChild(sessionElement);
    });

    scheduleContainer.appendChild(weekContainer);
  });
}

function createSessionElement(day, session, paces) {
  const element = document.createElement('div');
  element.className = 'training-session';

  element.innerHTML = `
    <h4>${translations.weekdays[day.toLowerCase()]}</h4>
    <div class="workout-details">
      <div class="workout-type">${session.workout}</div>
      <div class="workout-description">${session.description}</div>
      <div class="workout-intensity">
        Intensitet: ${paces[session.intensity] || session.intensity}
      </div>
      <div class="workout-duration">
        Tid: ${session.duration} ${session.duration_unit}
      </div>
      <div class="workout-priority">
        Prioritet: ${session.priority}
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

  // Add export button handler
  const exportButton = document.getElementById('export-pdf');
  if (exportButton) {
    exportButton.addEventListener('click', exportToPDF);
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

// setupTestEnvironment();

// Add to imports at top
import { jsPDF } from 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
import html2canvas from 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.min.js';

// Add new function for PDF export
async function exportToPDF() {
  try {
    const schedule = document.getElementById('training-schedule');
    if (!schedule) return;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15; // margins in mm
    let verticalOffset = margin;

    // Add title
    pdf.setFontSize(20);
    pdf.text('Training Plan', margin, verticalOffset);
    verticalOffset += 10;

    // Convert each week container to canvas and add to PDF
    const weekContainers = schedule.querySelectorAll('.week-container');
    for (const weekContainer of weekContainers) {
      const canvas = await html2canvas(weekContainer);
      const imgData = canvas.toDataURL('image/png');

      // Check if new page is needed
      if (verticalOffset > 270) {
        // A4 height minus margin
        pdf.addPage();
        verticalOffset = margin;
      }

      // Calculate dimensions to fit within page width
      const imgWidth = 210 - 2 * margin; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, verticalOffset, imgWidth, imgHeight);
      verticalOffset += imgHeight + 10;
    }

    // Save the PDF
    const today = new Date().toISOString().split('T')[0];
    pdf.save(`training-plan-${today}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(translations.errors.pdf_generation);
  }
}