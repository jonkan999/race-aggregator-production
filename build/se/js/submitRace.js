import { getFirebaseAuth } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

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

    // Redirect to Firebase Auth UI
    window.location.href = `/__/auth/action?mode=signIn&email=${encodeURIComponent(
      submitterEmail
    )}&continueUrl=${encodeURIComponent(window.location.href)}`;
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
