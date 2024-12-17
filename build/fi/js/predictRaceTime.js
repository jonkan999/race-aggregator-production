// Import the lookup table using fetch
let lookupTable;

async function loadLookupTable() {
  try {
    const response = await fetch('/js/lookupTable.json');
    const data = await response.json();
    lookupTable = data.data;
  } catch (error) {
    console.error('Error loading lookup table:', error);
  }
}

// Load the lookup table immediately
loadLookupTable();

// Define target distances
const targetDistances = [
  { distance: 1.60934, name: '1 Mile' },
  { distance: 3.0, name: '3K' },
  { distance: 3.21868, name: '2 Mile' },
  { distance: 5.0, name: '5K' },
  { distance: 10.0, name: '10K' },
  { distance: 15.0, name: '15K' },
  { distance: 21.0975, name: 'Half Marathon' },
  { distance: 42.195, name: 'Marathon' },
];

// Helper functions
export function formatTime(seconds) {
  if (isNaN(seconds)) {
    console.error('Invalid seconds:', seconds);
    return 'N/A';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function calculateHillAdjustment(basePaceSeconds) {
  if (isNaN(basePaceSeconds) || basePaceSeconds <= 0) {
    console.error('Invalid base pace:', basePaceSeconds);
    return 0;
  }
  const pacePerKm =
    basePaceSeconds < 600 ? basePaceSeconds : basePaceSeconds / 1.60934;
  const baseAdjustment = 12;
  let paceFactor = (pacePerKm - 240) / 90 + 1.0;
  paceFactor = Math.max(1.0, Math.min(3.0, paceFactor));
  return baseAdjustment * paceFactor;
}

export function interpolate(x, x1, x2, y1, y2) {
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

export async function predictRaceTime(distance, time, isHilly = false) {
  // Make sure lookup table is loaded
  if (!lookupTable) {
    await loadLookupTable();
  }

  console.log('predictRaceTime called with:', { distance, time, isHilly });

  // Find the two shortest distances from lookup table for extrapolation
  const shortestPreds = lookupTable[0].predictions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2);

  // Calculate pace change per km for short distances
  const paceChangePerKm =
    (shortestPreds[1].pace - shortestPreds[0].pace) /
    (shortestPreds[1].distance - shortestPreds[0].distance);

  const predictions = targetDistances.map((target) => {
    // Find closest points in lookup table for this target distance
    let closest = lookupTable
      .map((entry) => ({
        ...entry,
        diff:
          Math.abs(entry.input_distance - distance) +
          Math.abs(entry.input_time - time) / 3600,
      }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 4);

    let adjustedPace;

    // Use extrapolation for distances shorter than lookup table minimum
    if (target.distance < shortestPreds[0].distance) {
      const distanceDiff = shortestPreds[0].distance - target.distance;
      const basePace = shortestPreds[0].pace * (time / closest[0].input_time);
      adjustedPace = basePace - paceChangePerKm * distanceDiff;
    } else {
      // Use normal scaling for other distances
      const distanceRatio = distance / closest[0].input_distance;
      const timeRatio = time / closest[0].input_time;
      const paceRatio = timeRatio / distanceRatio;
      adjustedPace =
        closest[0].predictions.find(
          (p) => Math.abs(p.distance - target.distance) < 0.01
        )?.pace * paceRatio;
    }

    if (isNaN(adjustedPace)) {
      console.warn('Invalid pace calculation for:', target);
      return null;
    }

    if (isHilly) {
      const hillAdjustment = calculateHillAdjustment(adjustedPace);
      return {
        distance: target.distance,
        name: target.name,
        pace: adjustedPace + hillAdjustment,
        flatPace: adjustedPace,
        hillAdjustment: hillAdjustment,
        time: formatTime((adjustedPace + hillAdjustment) * target.distance),
        flatTime: formatTime(adjustedPace * target.distance),
      };
    }

    return {
      distance: target.distance,
      name: target.name,
      pace: adjustedPace,
      time: formatTime(adjustedPace * target.distance),
    };
  });

  // Add debug logging
  console.log('Generated predictions:', predictions);

  return predictions.filter((p) => p !== null && !isNaN(p.pace) && p.pace > 0);
}

// Helper function to format distance
function formatDistance(km) {
  const commonDistance = targetDistances.find(
    (d) => Math.abs(d.distance - km) < 0.01
  );
  if (commonDistance) {
    return commonDistance.name;
  }
  return `${km.toFixed(1)}km`;
}