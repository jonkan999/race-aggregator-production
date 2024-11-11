import { getFirebaseAuth } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

export async function submitRace() {
  try {
    const { auth } = await getFirebaseAuth();
    const formData = JSON.parse(localStorage.getItem('raceFormData'));
    const submitterEmail = formData['race-contact'];
    console.log('Attempting submission with:', submitterEmail);

    // Case 2: Already logged in with correct email
    if (auth.currentUser && auth.currentUser.email === submitterEmail) {
      alert(`Logged in as organizer ${submitterEmail}, submitting new race`);
      await processSubmission();
      return;
    }

    // If logged in with wrong email, sign out
    if (auth.currentUser) {
      console.log('Logging out current user');
      await auth.signOut();
    }

    // Store submission intent and email
    localStorage.setItem('pendingSubmission', 'true');
    localStorage.setItem('submitterEmail', submitterEmail);

    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocal) {
      // Local development flow
      if (signInMethods.length === 0) {
        // Case 1: New user
        const tempPassword = Math.random().toString(36).slice(-8);
        await createUserWithEmailAndPassword(
          auth,
          submitterEmail,
          tempPassword
        );
        await sendPasswordResetEmail(auth, submitterEmail);
        alert('Account created. Check your email to set your password.');
        await processSubmission();
      } else {
        // Case 3: Existing user
        const password = prompt('Enter your password:');
        if (!password) return;
        await signInWithEmailAndPassword(auth, submitterEmail, password);
        await processSubmission();
      }
    } else {
      // Production: Redirect to Firebase Auth
      const redirectUrl = `/__/auth/action?mode=signIn&apiKey=${
        auth.app.options.apiKey
      }&email=${encodeURIComponent(
        submitterEmail
      )}&continueUrl=${encodeURIComponent(window.location.href)}`;
      console.log('Redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
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
          alert(
            `Logged in as organizer ${submitterEmail}, submitting new race`
          );
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
  /*   localStorage.removeItem('raceFormData');
  localStorage.removeItem('raceCoordinates');
  localStorage.removeItem('raceImages');
  localStorage.removeItem('pendingSubmission');
  localStorage.removeItem('submitterEmail'); */
}