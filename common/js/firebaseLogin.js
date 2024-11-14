import { getFirebaseAuth } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

const messages = {
  auth: {
    titleSignIn: '{{ auth_modal.title_sign_in }}',
    passwordPlaceholder: '{{ auth_modal.password_placeholder }}',
    submitSignIn: '{{ auth_modal.submit_sign_in }}',
    createAccount: '{{ auth_modal.create_account }}',
    namePlaceholder: '{{ auth_modal.name_placeholder }}',
    emailPlaceholder: '{{ auth_modal.email_placeholder }}',
    forgotPassword: '{{ auth_modal.forgot_password }}',
    errorWrongPassword: '{{ auth_modal.error_wrong_password }}',
    errorEmailNotFound: '{{ auth_modal.error_email_not_found }}',
    promptResetPassword: '{{ auth_modal.prompt_reset_password }}',
    promptCreateAccount: '{{ auth_modal.prompt_create_account }}',
    already_logged_in: '{{ auth_modal.already_logged_in }}',
    as_email: '{{ auth_modal.as_email }}',
    continue_as_user: '{{ auth_modal.continue_as_user }}',
    logout_and_switch: '{{ auth_modal.logout_and_switch }}',
    error_invalid_credential: '{{ auth_modal.error_invalid_credential }}',
    error_too_many_requests: '{{ auth_modal.error_too_many_requests }}',
  },
  submission: {
    passwordResetSent: '{{ submission_flow.password_reset_sent }}',
  },
};
console.log(messages.auth.titleSignIn);
console.log(messages.auth.namePlaceholder);
console.log(messages.auth.emailPlaceholder);
console.log(messages.auth.passwordPlaceholder);
console.log(messages.auth.submitSignIn);
console.log(messages.auth.createAccount);
console.log(messages.auth.forgotPassword);

export function initializeHeaderLogin() {
  console.log('Initializing header login...');
  const modalContainer = document.querySelector('.auth-modal-container');
  const loginIcon = document.querySelector('.login-icon');

  // Get all form containers
  const loginFormContainer = document.getElementById('loginForm');
  const createAccountContainer = document.getElementById('createAccountForm');
  const resetPasswordContainer = document.getElementById('resetPasswordForm');
  const loggedInUserContainer = document.getElementById('loggedInUserForm');

  // Get forms
  const loginForm = document.getElementById('authForm');
  const signupForm = document.getElementById('signupForm');
  const resetForm = document.getElementById('resetForm');

  // Get error divs
  const loginError = document.getElementById('loginError');
  const signupError = document.getElementById('signupError');
  const resetError = document.getElementById('resetError');

  // Initialize Firebase Auth
  let auth;
  getFirebaseAuth().then(({ auth: firebaseAuth }) => {
    auth = firebaseAuth;
    updateLoginState(auth);
    auth.onAuthStateChanged((user) => updateLoginState(auth));
  });

  // Show modal when login icon is clicked
  loginIcon.addEventListener('click', async () => {
    const user = auth.currentUser;
    modalContainer.style.display = 'block';

    if (user) {
      // Show logged in user modal
      showLoggedInUserModal(user);
    } else {
      // Show regular login form
      showForm('login');
    }
  });

  // Handle continue as user
  document.getElementById('continueAsUser').addEventListener('click', () => {
    modalContainer.style.display = 'none';
  });

  // Handle logout and switch
  document
    .getElementById('logoutAndSwitch')
    .addEventListener('click', async () => {
      try {
        await signOut(auth);
        showForm('login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    });

  // Close modal when clicking backdrop
  const backdrop = modalContainer.querySelector('.auth-modal-backdrop');
  backdrop.addEventListener('click', () => {
    modalContainer.style.display = 'none';
    resetForms();
  });

  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const errorResetLink = document.getElementById('errorResetLink');
    const errorCreateLink = document.getElementById('errorCreateLink');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      modalContainer.style.display = 'none';
      resetForms();
    } catch (error) {
      console.log('error.code', error.code);

      if (error.code === 'auth/invalid-credential') {
        // Show wrong password error with reset link
        errorDiv.textContent = messages.auth.errorWrongPassword;
        errorResetLink.style.display = 'block';
        errorCreateLink.style.display = 'none';
        errorResetLink.onclick = (e) => {
          e.preventDefault();
          showForm('reset');
          document.getElementById('resetEmail').value = email;
        };
      } else if (error.code === 'auth/user-not-found') {
        // Show user not found error with create account link
        errorDiv.textContent = messages.auth.errorEmailNotFound;
        errorResetLink.style.display = 'none';
        errorCreateLink.style.display = 'block';
        errorCreateLink.onclick = (e) => {
          e.preventDefault();
          showForm('create');
          document.getElementById('signupEmail').value = email;
        };
      } else if (error.code === 'auth/too-many-requests') {
        errorDiv.textContent = messages.auth.error_too_many_requests;
        errorResetLink.style.display = 'block';
        errorCreateLink.style.display = 'none';
        errorResetLink.onclick = (e) => {
          e.preventDefault();
          showForm('reset');
          document.getElementById('resetEmail').value = email;
        };
      } else {
        errorDiv.textContent = messages.auth.error_invalid_credential;
        errorResetLink.style.display = 'none';
        errorCreateLink.style.display = 'none';
      }
    }
  });

  // Handle create account form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Update the display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Update success message with user details
      document.getElementById('newUserName').textContent = name;
      document.getElementById('newUserEmail').textContent = email;

      // Show success message
      showForm('success');

      // Add event listener to continue button
      document
        .getElementById('successContinue')
        .addEventListener('click', () => {
          modalContainer.style.display = 'none';
          resetForms();
        });

      // Auto-hide modal after 5 seconds
      setTimeout(() => {
        modalContainer.style.display = 'none';
        resetForms();
      }, 5000);
    } catch (error) {
      signupError.textContent = error.message;
    }
  });

  // Handle password reset form submission
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;

    try {
      await sendPasswordResetEmail(auth, email);
      alert(messages.submission.passwordResetSent);
      showForm('login');
    } catch (error) {
      resetError.textContent = error.message;
    }
  });

  // Navigation between forms
  document
    .getElementById('showCreateAccount')
    .addEventListener('click', () => showForm('create'));
  document
    .getElementById('showResetPassword')
    .addEventListener('click', () => showForm('reset'));
  document
    .getElementById('backToLogin')
    .addEventListener('click', () => showForm('login'));
  document
    .getElementById('backToLoginFromReset')
    .addEventListener('click', () => showForm('login'));

  // Helper functions
  function showForm(formType) {
    loginFormContainer.style.display = 'none';
    createAccountContainer.style.display = 'none';
    resetPasswordContainer.style.display = 'none';
    loggedInUserContainer.style.display = 'none';
    document.getElementById('accountCreatedForm').style.display = 'none';

    switch (formType) {
      case 'login':
        loginFormContainer.style.display = 'block';
        break;
      case 'create':
        createAccountContainer.style.display = 'block';
        break;
      case 'reset':
        resetPasswordContainer.style.display = 'block';
        break;
      case 'logged-in':
        loggedInUserContainer.style.display = 'block';
        break;
      case 'success':
        document.getElementById('accountCreatedForm').style.display = 'block';
        break;
    }
  }

  function showLoggedInUserModal(user) {
    const userNameElement = document.getElementById('currentUserName');
    const userEmailElement = document.getElementById('currentUserEmail');

    userNameElement.textContent = user.displayName || 'User';
    userEmailElement.textContent = `${messages.auth.as_email}: ${user.email}`;

    showForm('logged-in');
  }

  function resetForms() {
    loginForm.reset();
    signupForm.reset();
    resetForm.reset();
    loginError.textContent = '';
    signupError.textContent = '';
    resetError.textContent = '';
    document.getElementById('errorResetLink').style.display = 'none';
    document.getElementById('errorCreateLink').style.display = 'none';
  }
}

function updateLoginState(auth) {
  const loginIcon = document.querySelector('.login-icon');
  const userDisplayName = document.getElementById('currentUserDisplayName');
  if (!loginIcon || !userDisplayName) return;

  if (auth.currentUser) {
    console.log('User is logged in:', auth.currentUser.email);
    loginIcon.setAttribute('name', 'person-circle');
    loginIcon.style.color = 'var(--color-primary)';
    userDisplayName.textContent = auth.currentUser.displayName || 'User';
    userDisplayName.style.display = 'block';
  } else {
    console.log('User is logged out');
    loginIcon.setAttribute('name', 'person-circle-outline');
    loginIcon.style.color = 'var(--color-primary-shade)';
    userDisplayName.style.display = 'none';
    userDisplayName.textContent = '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHeaderLogin);

export { updateLoginState };
