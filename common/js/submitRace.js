import { getFirebaseAuth } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

// Add CSS to your stylesheet or include it here
const styles = `
.auth-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
}

.auth-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
}

.auth-modal form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-modal input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.auth-modal button {
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.auth-modal button:hover {
  background: #0056b3;
}

.auth-modal .error {
  color: red;
  font-size: 14px;
}
`;

export async function submitRace() {
  try {
    const { auth } = await getFirebaseAuth();
    const formData = JSON.parse(localStorage.getItem('raceFormData'));
    const submitterEmail = formData['race-contact'];

    console.log('=== Race Submission Flow ===');
    console.log('Attempting submission with email:', submitterEmail);
    console.log(
      'Current auth state:',
      auth.currentUser
        ? `Logged in as ${auth.currentUser.email}`
        : 'Not logged in'
    );

    // Case 2: Already logged in with correct email
    if (auth.currentUser && auth.currentUser.email === submitterEmail) {
      console.log('CASE 2: User already logged in with correct email');
      console.log('- Current user email matches race contact email');
      console.log('- Proceeding directly to submission');
      alert(`Logged in as organizer ${submitterEmail}, submitting new race`);
      await processSubmission();
      return;
    }

    // If logged in with wrong email, sign out
    if (auth.currentUser) {
      console.log('Logged in with wrong email');
      console.log('- Current user:', auth.currentUser.email);
      console.log('- Required email:', submitterEmail);
      console.log('- Signing out current user');
      await auth.signOut();
    }

    // Try to create new user first
    try {
      console.log('Attempting to create new user');
      const tempPassword = Math.random().toString(36).slice(-8);
      await createUserWithEmailAndPassword(auth, submitterEmail, tempPassword);
      console.log('CASE 1: New user created successfully');
      console.log('- Sending password reset email');
      await sendPasswordResetEmail(auth, submitterEmail);
      alert('Account created. Check your email to set your password.');
      await processSubmission();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // Case 3: Existing user
        console.log('CASE 3: Existing user detected');
        console.log('- Email already registered');
        console.log('- Will prompt for password');
        showAuthModal(auth, submitterEmail, false);
      } else {
        console.error('Unexpected error:', error);
        alert('An error occurred. Please try again.');
      }
    }
  } catch (error) {
    console.error('Submission error:', error);
    console.error('Stack:', error.stack);
    alert('Failed to process submission');
  }
}

function showAuthModal(auth, email, isNewUser) {
  console.log('=== Auth Modal ===');
  console.log(`Showing ${isNewUser ? 'new user' : 'existing user'} auth modal`);

  // Add styles
  if (!document.getElementById('auth-modal-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'auth-modal-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Create modal
  const modalHtml = `
    <div class="auth-modal-backdrop"></div>
    <div class="auth-modal">
      <h2>${isNewUser ? 'Create Account' : 'Sign In'}</h2>
      <form id="authForm">
        <input type="email" value="${email}" readonly>
        <input type="password" id="password" placeholder="Password" required>
        <div class="error" id="authError"></div>
        <button type="submit">${
          isNewUser ? 'Create Account' : 'Sign In'
        }</button>
        ${
          !isNewUser
            ? '<button type="button" id="forgotPassword">Forgot Password?</button>'
            : ''
        }
      </form>
    </div>
  `;

  // Add modal to page
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);

  // Handle form submission
  const form = document.getElementById('authForm');
  const errorDiv = document.getElementById('authError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;

    try {
      console.log('Attempting sign in');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful');
      console.log('Processing submission');
      await processSubmission();
      modalContainer.remove();
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error code:', error.code);
      if (error.code === 'auth/wrong-password') {
        errorDiv.textContent =
          'Incorrect password. Try again or use "Forgot Password"';
      } else {
        errorDiv.textContent = error.message;
      }
    }
  });

  // Handle forgot password
  const forgotBtn = document.getElementById('forgotPassword');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', async () => {
      try {
        console.log('Sending password reset email');
        await sendPasswordResetEmail(auth, email);
        console.log('Password reset email sent successfully');
        alert('Password reset email sent. Please check your inbox.');
        modalContainer.remove();
      } catch (error) {
        console.error('Reset error:', error);
        errorDiv.textContent = error.message;
      }
    });
  }

  // Close on backdrop click
  const backdrop = modalContainer.querySelector('.auth-modal-backdrop');
  backdrop.addEventListener('click', () => modalContainer.remove());
}

async function processSubmission() {
  console.log('=== Processing Submission ===');
  console.log('Race submitted successfully');
  alert('Race submitted successfully!');
  clearFormAndStorage();
}

function clearFormAndStorage() {
  localStorage.removeItem('raceFormData');
  localStorage.removeItem('raceCoordinates');
  localStorage.removeItem('raceImages');
}
