import { getFirebaseAuth } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js';

const messages = {
  auth: {
    titleNewUser: 'Opprett konto',
    titleSignIn: 'Logg inn',
    passwordPlaceholder: 'Passord',
    submitNewUser: 'Opprett konto',
    submitSignIn: 'Logg inn',
    forgotPassword: 'Glemt passord?',
    errorWrongPassword: 'Feil passord',
  },
  submission: {
    loggedInAs: 'Innlogget som arrangør',
    submittingNewRace: 'sender inn nytt løp',
    newAccountCreated: 'For at løpet skal kunne håndteres må du bekrefte e-postadressen din. En bekreftelseslink har blitt sendt til den angitte e-postadressen.',
    passwordResetSent: 'Tilbakestilling av passord er sendt. Sjekk innboksen din.',
    unexpectedError: 'En feil oppstod. Prøv igjen.',
    processingSubmission: 'Behandler innsending...',
    raceExists: 'Løpet finnes allerede i databasen.',
    raceSubmitted: 'Løpet er sendt inn!',
    submissionFailed: 'Kunne ikke sende inn løpet. Prøv igjen.',
    missingFields: 'Noe mangler. Sørg for at alle obligatoriske felt er fylt ut og at et sted er valgt på kartet.',
  },
};

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
  background: #00925e;
  

  color: white;
  cursor: pointer;
}

.auth-modal button:hover {
  background: #00a96d;
}

.auth-modal .error {
  color: red;
  font-size: 14px;
}
`;

function getFormData() {
  const formData = JSON.parse(localStorage.getItem('raceFormData'));
  const mapCoordinates = JSON.parse(localStorage.getItem('raceCoordinates'));
  const raceImages = JSON.parse(localStorage.getItem('raceImages'));

  // Clean form data
  const cleanFormData = {};
  Object.entries(formData).forEach(([key, value]) => {
    const cleanKey = key.replace('race-', '');
    cleanFormData[cleanKey] = value;
  });
  return { cleanFormData, mapCoordinates, raceImages };
}

export async function submitRace() {
  try {
    const { auth, db } = await getFirebaseAuth();
    const { cleanFormData, mapCoordinates, raceImages } = getFormData();
    const submitterEmail = cleanFormData.contact;

    // Validate required fields
    if (
      !cleanFormData ||
      !mapCoordinates ||
      !cleanFormData.name ||
      !cleanFormData.type ||
      !cleanFormData.date ||
      !cleanFormData.location ||
      !cleanFormData.contact
    ) {
      alert(messages.submission.missingFields);
      return;
    }

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
      alert(
        `${messages.submission.loggedInAs} ${submitterEmail}, ${messages.submission.submittingNewRace}`
      );
      await processSubmission(db, auth.currentUser.uid);
      return;
    }

    // If logged in with wrong email, sign out
    if (auth.currentUser) {
      console.log('Logging out current user');
      await auth.signOut();
    }

    // Try to create new user first
    try {
      console.log('Attempting to create new user');
      const tempPassword = Math.random().toString(36).slice(-8);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        submitterEmail,
        tempPassword
      );
      console.log('CASE 1: New user created successfully');
      console.log('- Sending password reset email');
      await sendPasswordResetEmail(auth, submitterEmail);
      alert(messages.submission.newAccountCreated);
      await processSubmission(db, userCredential.user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // Case 3: Existing user
        console.log('CASE 3: Existing user detected');
        console.log('- Email already registered');
        console.log('- Will prompt for password');
        showAuthModal(auth, db, submitterEmail, false);
      } else {
        console.error('Unexpected error:', error);
        alert(messages.submission.unexpectedError);
      }
    }
  } catch (error) {
    console.error('Submission error:', error);
    console.error('Stack:', error.stack);
    alert(messages.submission.submissionFailed);
  }
}

function showAuthModal(auth, db, email, isNewUser) {
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
      <h2>${
        isNewUser ? messages.auth.titleNewUser : messages.auth.titleSignIn
      }</h2>
      <form id="authForm">
        <input type="email" value="${email}" readonly>
        <input type="password" id="password" placeholder="${
          messages.auth.passwordPlaceholder
        }" required>
        <div class="error" id="authError"></div>
        <button type="submit">${
          isNewUser ? messages.auth.submitNewUser : messages.auth.submitSignIn
        }</button>
        ${
          !isNewUser
            ? `<button type="button" id="forgotPassword">${messages.auth.forgotPassword}</button>`
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log('Sign in successful');
      console.log('Processing submission');
      await processSubmission(db, userCredential.user.uid);
      modalContainer.remove();
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error code:', error.code);
      if (error.code === 'auth/wrong-password') {
        errorDiv.textContent = messages.auth.errorWrongPassword;
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
        alert(messages.submission.passwordResetSent);
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

async function processSubmission(db, userId) {
  console.log('=== Processing Submission ===');

  const { cleanFormData, mapCoordinates, raceImages } = getFormData();

  // Upload images first if they exist
  let imageUrls = [];
  if (raceImages && raceImages.images.length > 0) {
    try {
      const storage = getStorage();

      // Upload each image and get its URL
      for (let i = 0; i < raceImages.images.length; i++) {
        const imageData = raceImages.images[i];
        // Convert base64 to blob
        const imageBlob = await fetch(imageData).then((r) => r.blob());

        // Create a unique filename with .webp extension
        const filename = `races/${cleanFormData.date}_${cleanFormData.name}_${i}.webp`;
        const storageRef = ref(storage, filename);

        // Upload the WebP image
        await uploadBytes(storageRef, imageBlob, {
          contentType: 'image/webp', // Explicitly set the content type
        });

        // Get the download URL
        const imageUrl = await getDownloadURL(storageRef);
        imageUrls.push(imageUrl);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
      return;
    }
  }

  const raceObject = {
    date: cleanFormData.date.replace(/-/g, ''),
    type: cleanFormData.type.toLowerCase(),
    name: cleanFormData.name,
    distances: JSON.stringify(cleanFormData.distances),
    start_time: cleanFormData['start-time'],
    place: cleanFormData.location,
    latitude: mapCoordinates.latitude,
    longitude: mapCoordinates.longitude,
    organizer: cleanFormData.organizer,
    contact: cleanFormData.contact,
    website: cleanFormData.website,
    price_range: cleanFormData['price-range'],
    summary: cleanFormData.summary,
    additional: cleanFormData.additional,
    // Store image URLs instead of the actual images
    imageUrls: imageUrls,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdBy: userId,
    email: cleanFormData.contact,
    editors: [userId],
  };

  if (cleanFormData['multi-day-toggle'] === 'on') {
    raceObject['end_date'] = cleanFormData['end_date'].replace(/-/g, '');
  }

  // Check for duplicates
  const racesRef = collection(db, 'submissions_no');
  const q = query(
    racesRef,
    where('name', '==', raceObject.name),
    where('date', '==', raceObject.date)
  );

  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      alert(messages.submission.raceExists);
      return;
    }

    // Create the race document
    await addDoc(racesRef, raceObject);
    console.log('Race submitted successfully');

    // Update the new_race_added document
    const newRaceAddedRef = doc(racesRef, 'new_race_added');
    await setDoc(newRaceAddedRef, { is_active: true }, { merge: true });
    console.log('Updated new_race_added flag');

    alert(messages.submission.raceSubmitted);
    clearFormAndStorage();
  } catch (error) {
    console.error('Error submitting race:', error);
    alert(messages.submission.submissionFailed);
  }
}

function clearFormAndStorage() {
  /*   localStorage.removeItem('raceFormData');
  localStorage.removeItem('raceCoordinates');
  localStorage.removeItem('raceImages'); */
}