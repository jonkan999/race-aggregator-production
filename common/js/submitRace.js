import { db } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function submitRace() {
  try {
    console.log('Starting race submission...');

    const formData = JSON.parse(localStorage.getItem('raceFormData'));
    const mapCoordinates = JSON.parse(localStorage.getItem('raceCoordinates'));
    const raceImages = JSON.parse(localStorage.getItem('raceImages'));

    if (!formData || !mapCoordinates || !raceImages) {
      throw new Error('Missing required data');
    }

    const raceObject = {
      date: formData.date.replace(/-/g, ''),
      name: formData.name,
      place: formData.location || '',
      latitude: mapCoordinates.latitude,
      longitude: mapCoordinates.longitude,
      // ... other fields ...
      created_at: new Date().toISOString(),
    };

    console.log('Race object prepared:', raceObject);

    // Try to add the document
    const racesRef = collection(db, 'submissions_se');
    const docRef = await addDoc(racesRef, raceObject);

    console.log('Document written with ID: ', docRef.id);

    // Clear form and redirect
    localStorage.removeItem('raceFormData');
    localStorage.removeItem('raceCoordinates');
    localStorage.removeItem('raceImages');

    window.location.href = '/races.html';
  } catch (error) {
    console.error('Error in submitRace:', error);
    alert(`Failed to submit race: ${error.message}`);
  }
}
