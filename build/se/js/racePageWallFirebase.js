import { getFirebaseAuth } from './firebaseConfig.js';
import {
  collection,
  addDoc,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

export function initializeRaceForum() {
  console.log('Starting forum initialization...');

  const forumInput = document.getElementById('forum-input');
  const submitButton = document.getElementById('forum-submit');
  const loginPrompt = document.getElementById('login-prompt');
  const country = 'se';

  // Debug log elements
  console.log('Forum elements found:', {
    forumInput: !!forumInput,
    submitButton: !!submitButton,
    loginPrompt: !!loginPrompt,
  });

  // Add click handler immediately, don't wait for initialization
  if (loginPrompt) {
    console.log('Setting up login prompt click handler');
    loginPrompt.addEventListener('click', () => {
      console.log('Login prompt clicked');
      const loginIcon = document.querySelector('.login-icon');
      if (loginIcon) {
        loginIcon.click();
      } else {
        console.error('Login icon not found');
      }
    });
  }

  async function initialize() {
    console.log('Initializing race forum...');
    const { auth, db } = await getFirebaseAuth();
    console.log('Firebase DB initialized:', !!db);

    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', !!user);
      forumInput.disabled = !user;
      submitButton.style.display = user ? 'block' : 'none';
      loginPrompt.style.display = user ? 'none' : 'block';
    });

    // Handle post submission
    submitButton?.addEventListener('click', async () => {
      const content = forumInput.value.trim();
      if (!content || !auth.currentUser) return;

      try {
        await addDoc(collection(db, `forum_posts_${country}`), {
          content,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: new Date(),
          type: 'question',
        });
        forumInput.value = '';
        console.log('Post submitted successfully');
      } catch (error) {
        console.error('Error posting message:', error);
      }
    });
  }

  // Initialize and handle any errors
  initialize().catch((error) => {
    console.error('Failed to initialize race forum:', error);
  });
}

// Make sure the function is called when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing forum...');
  initializeRaceForum();
});