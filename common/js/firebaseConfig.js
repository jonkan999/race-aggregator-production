import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDJC1Lb7bLcSyVt6dhiqy_QA8W-f2dlcjk',
  authDomain: 'aggregatory-440306.firebaseapp.com',
  projectId: 'aggregatory-440306',
  storageBucket: 'aggregatory-440306.firebasestorage.app',
  messagingSenderId: '353622401342',
  appId: '1:353622401342:web:c5d687352018fc621ecc6f',
  measurementId: 'G-E73LE6BWM9',
};

// Initialize Firebase and Firestore asynchronously
export async function initializeFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Enable offline persistence
    try {
      await enableIndexedDbPersistence(db);
      console.log('Offline persistence enabled');
    } catch (err) {
      if (err.code == 'failed-precondition') {
        console.warn(
          'Multiple tabs open, persistence can only be enabled in one tab at a a time.'
        );
      } else if (err.code == 'unimplemented') {
        console.warn("The current browser doesn't support persistence.");
      }
    }

    return db;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}
