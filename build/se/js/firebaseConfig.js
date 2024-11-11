import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
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
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  return { auth, signInWithRedirect, getRedirectResult };
};

// Export the initialization promise
export const firebaseInit = initFirebase();

// Export a helper function to get the auth instance
export const getFirebaseAuth = async () => {
  const firebase = await firebaseInit;
  return firebase;
};
