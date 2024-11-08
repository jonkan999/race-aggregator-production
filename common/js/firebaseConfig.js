import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  authDomain: 'aggregatory-440306.firebaseapp.com',
  projectId: 'aggregatory-440306',
  storageBucket: 'aggregatory-440306.firebasestorage.app',
  messagingSenderId: '353622401342',
  appId: '1:353622401342:web:c5d687352018fc621ecc6f',
};

// Initialize Firebase and Firestore asynchronously
export async function initializeFirebase() {
  try {
    // Get API key using the same mechanism as Mapbox
    const keys = await fetchKeys();
    firebaseConfig.apiKey = keys.FIREBASE_API_KEY;

    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Helper function to get keys
async function fetchKeys() {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    const { FIREBASE_API_KEY } = await import('./keys_local.js');
    return { FIREBASE_API_KEY };
  }

  try {
    const response = await fetch('https://getapikeys-bhro7jtuda-ey.a.run.app');
    return await response.json();
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw new Error('Failed to load API keys: ' + error.message);
  }
}
