import { initializeFirebase } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let db;

export async function initializeDb() {
  if (!db) {
    db = await initializeFirebase();
  }
  return db;
}

export async function submitRace() {
  try {
    db = await initializeDb();
    console.log('Database initialized');

    const formData = JSON.parse(localStorage.getItem('raceFormData'));
    const mapCoordinates = JSON.parse(localStorage.getItem('raceCoordinates'));
    const raceImages = JSON.parse(localStorage.getItem('raceImages'));

    if (!formData || !mapCoordinates || !raceImages) {
      alert(
        "Missing data. Please make sure you've filled out the form and selected a location on the map."
      );
      return;
    }

    // Clean up form data by removing 'race-' prefix
    const cleanFormData = {};
    Object.entries(formData).forEach(([key, value]) => {
      const cleanKey = key.replace('race-', '');
      cleanFormData[cleanKey] = value;
    });

    const raceObject = {
      date: cleanFormData.date.replace(/-/g, ''),
      type: cleanFormData.type.toLowerCase(),
      name: cleanFormData.name,
      distances: JSON.stringify(cleanFormData.distances),
      place: cleanFormData.location,
      latitude: mapCoordinates.latitude,
      longitude: mapCoordinates.longitude,
      organizer: cleanFormData.organizer,
      contact: cleanFormData.contact,
      website: cleanFormData.website,
      'price-range': cleanFormData['price-range'],
      summary: cleanFormData.summary,
      additional: cleanFormData.additional,
      images: raceImages.images,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (cleanFormData['multi-day-toggle'] === 'on') {
      raceObject['end-date'] = cleanFormData['end-date'].replace(/-/g, '');
    }

    // Use country-specific collection (injected during build)
    const racesRef = collection(db, 'submissions_{{ country_code }}');
    console.log('Collection reference created:', racesRef);

    // Check for duplicates within this country's collection
    const q = query(
      racesRef,
      where('name', '==', raceObject.name),
      where('date', '==', raceObject.date)
    );
    console.log('Query created');

    const querySnapshot = await getDocs(q);
    console.log('Query executed');

    if (!querySnapshot.empty) {
      alert('A race with this name and date already exists!');
      return;
    }

    // Add to country-specific collection
    const docRef = await addDoc(racesRef, raceObject);
    console.log('Race added with ID: ', docRef.id);

    clearFormAndStorage();
    window.location.href =
      '/{{ navigation["race-list"] | slugify(country_code) }}.html';
  } catch (error) {
    console.error('Error in submitRace:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    alert(`Failed to submit race: ${error.message}`);
  }
}

function clearFormAndStorage() {
  localStorage.removeItem('raceFormData');
  localStorage.removeItem('raceCoordinates');
  localStorage.removeItem('raceImages');
}
