import { authService } from './firebaseAuthService.js';
import {
  collection,
  addDoc,
  doc,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

export function initializeForum() {
  console.log('Starting forum initialization...');

  const threadInputContainer = document.getElementById(
    'thread-input-container'
  );
  const threadInput = document.getElementById('thread-input');
  const threadTitleInput = document.getElementById('thread-title-input');
  const submitButton = document.getElementById('thread-submit');
  const loginPrompt = document.getElementById('login-prompt');
  const country = document.body.getAttribute('data-country');
  const categorySlug = document.body.getAttribute('data-category');

  async function initialize() {
    console.log('Initializing forum...');
    const auth = await authService.getAuth();
    const db = await authService.getDb();

    // Handle thread input container clicks
    if (threadInputContainer) {
      threadInputContainer.addEventListener('click', () => {
        if (!auth.currentUser) {
          const loginContainer = document.querySelector('.login-container');
          if (loginContainer) {
            loginContainer.click();
          }
        }
      });
    }

    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      if (threadInput && threadTitleInput) {
        threadInput.disabled = !user;
        threadTitleInput.disabled = !user;
        threadInput.style.pointerEvents = user ? 'auto' : 'none';
        threadTitleInput.style.pointerEvents = user ? 'auto' : 'none';
        threadInput.style.cursor = user ? 'auto' : 'pointer';
        threadTitleInput.style.cursor = user ? 'auto' : 'pointer';
        submitButton.style.display = user ? 'block' : 'none';
        loginPrompt.style.display = user ? 'none' : 'block';
      }
    });

    // Add new thread
    submitButton?.addEventListener('click', async () => {
      const content = threadInput.value.trim();
      const title = threadTitleInput.value.trim();

      if (!content || !title || !auth.currentUser) return;

      try {
        const threadId = crypto.randomUUID();
        const timestamp = new Date();

        // Create batch for atomic operations
        const batch = writeBatch(db);

        // Add thread info
        const threadRef = doc(
          collection(db, `forum_posts_${country}`),
          categorySlug,
          threadId
        );
        batch.set(threadRef, {
          title,
          content,
          id: threadId,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: timestamp,
          updatedAt: timestamp,
          postCount: 1,
        });

        // Add initial post
        const postRef = doc(collection(threadRef, 'posts'));
        batch.set(postRef, {
          content,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: timestamp,
        });

        await batch.commit();

        // Redirect to the new thread
        window.location.href = `${threadId}/`;
      } catch (error) {
        console.error('Error creating thread:', error);
      }
    });
  }

  // Initialize and handle errors
  initialize().catch((error) => {
    console.error('Failed to initialize forum:', error);
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeForum);