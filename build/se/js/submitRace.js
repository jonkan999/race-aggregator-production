import { getFirebaseAuth } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

export async function submitRace() {
  try {
    const { auth } = await getFirebaseAuth();
    const formData = JSON.parse(localStorage.getItem('raceFormData'));
    const submitterEmail = formData['race-contact'];
    console.log('Attempting submission with:', submitterEmail);

    // Case 1: Already logged in
    if (auth.currentUser) {
      if (auth.currentUser.email === submitterEmail) {
        await processSubmission();
        return;
      } else {
        console.log('Logging out current user');
        await auth.signOut();
      }
    }

    // Store submission intent and email
    localStorage.setItem('pendingSubmission', 'true');
    localStorage.setItem('submitterEmail', submitterEmail);

    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocal) {
      // Local development: Use direct Firebase Auth
      const password = prompt('Please enter your password:');
      if (!password) return;

      try {
        await signInWithEmailAndPassword(auth, submitterEmail, password);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          await createUserWithEmailAndPassword(auth, submitterEmail, password);
        } else {
          throw error;
        }
      }
      await handleAuthRedirect();
    } else {
      // Production: Use Firebase Auth UI with the correct mode
      const authUrl = `/__/auth/handler?operation=signIn&email=${encodeURIComponent(
        submitterEmail
      )}&continueUrl=${encodeURIComponent(window.location.href)}`;
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Failed to process submission');
  }
}

export async function handleAuthRedirect() {
  try {
    const { auth } = await getFirebaseAuth();
    const submitterEmail = localStorage.getItem('submitterEmail');

    if (auth.currentUser) {
      console.log('User is signed in:', auth.currentUser.email);
      if (auth.currentUser.email === submitterEmail) {
        if (localStorage.getItem('pendingSubmission')) {
          console.log('Processing submission after redirect');
          await processSubmission();
          localStorage.removeItem('pendingSubmission');
          localStorage.removeItem('submitterEmail');
        }
      } else {
        console.log('Email mismatch');
        alert('The email in the form must match your account email');
        await auth.signOut();
        localStorage.removeItem('pendingSubmission');
        localStorage.removeItem('submitterEmail');
      }
    }
  } catch (error) {
    console.error('Redirect handling error:', error);
    alert('Authentication failed after redirect');
    localStorage.removeItem('pendingSubmission');
    localStorage.removeItem('submitterEmail');
  }
}

async function processSubmission() {
  console.log('Processing submission...');
  alert('Race submitted successfully!');
  clearFormAndStorage();
}

function clearFormAndStorage() {
  localStorage.removeItem('raceFormData');
  localStorage.removeItem('raceCoordinates');
  localStorage.removeItem('raceImages');
  localStorage.removeItem('pendingSubmission');
  localStorage.removeItem('submitterEmail');
}