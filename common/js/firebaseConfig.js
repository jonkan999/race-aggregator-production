import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { firebaseKeyLoaded } from './keys.js';

// Wait for the API key to load before initializing Firebase
const initFirebase = async () => {
  const apiKey = await firebaseKeyLoaded;

  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: 'aggregatory-440306.firebaseapp.com',
    projectId: 'aggregatory-440306',
    storageBucket: 'aggregatory-440306.firebasestorage.app',
    messagingSenderId: '353622401342',
    appId: '1:353622401342:web:c5d687352018fc621ecc6f',
    measurementId: 'G-E73LE6BWM9',
    signInOptions: [
      {
        provider: 'password',
        requireDisplayName: false,
      },
      {
        provider: 'google.com',
        customParameters: {
          prompt: 'select_account',
        },
      },
    ],
    signInFlow: 'redirect',
    callbacks: {
      signInSuccessWithAuthResult: () => false, // Don't redirect after sign-in
    },
    experimentalForceLongPolling: false,
    experimentalAutoDetectLongPolling: false,
    cacheSizeBytes: 0, // Disable offline persistence
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Only create db when explicitly needed
  const getDb = () => getFirestore(app);

  return { app, auth, getDb };
};

// Export the initialization promise
export const firebaseInit = initFirebase();

// Export a helper function to get the auth instance
export const getFirebaseAuth = async () => {
  const firebase = await firebaseInit;
  return firebase;
};
