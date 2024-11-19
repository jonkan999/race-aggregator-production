import { authService } from './firebaseAuthService.js';
import {
  collection,
  addDoc,
  doc,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

export function initializeRaceForum() {
  console.log('Starting forum initialization...');

  const forumInputContainer = document.getElementById('forum-input-container');
  const forumInput = document.getElementById('forum-input');
  const submitButton = document.getElementById('forum-submit');
  const loginPrompt = document.getElementById('login-prompt');
  const country = 'se';
  const errorWrongPassword =
    'Logga in eller skapa ett konto för att ställa en fråga';

  async function initialize() {
    console.log('Initializing race forum...');
    const auth = await authService.getAuth();
    const db = await authService.getDb();
    console.log('Firebase DB initialized:', !!db);

    // Add click handler after we have auth
    if (forumInputContainer) {
      console.log('Setting up forum input click handler');
      forumInputContainer.addEventListener('click', () => {
        // Only trigger login if user is not authenticated
        if (!auth.currentUser) {
          console.log('Forum input clicked - user not logged in');
          const loginContainer = document.querySelector('.login-container');
          if (loginContainer) {
            console.log('Login container found, clicking');
            loginContainer.click();
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = errorWrongPassword;
          }
        }
      });
    }

    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', !!user);
      forumInput.disabled = !user;
      forumInput.style.pointerEvents = user ? 'auto' : 'none';
      forumInput.style.cursor = user ? 'auto' : 'pointer';
      forumInput.style.borderColor = user
        ? 'var(--color-primary-tint)'
        : 'var(--color-divider-grey)';
      submitButton.style.display = user ? 'block' : 'none';
      loginPrompt.style.display = user ? 'none' : 'block';
    });

    // Add template post element (hidden by default)
    const forumPosts = document.getElementById('forum-posts');
    const emptyPost = document.createElement('div');
    emptyPost.className = 'forum-post template-post';
    emptyPost.style.display = 'none';
    emptyPost.innerHTML = `
      <div class="post-header">
        <span class="post-author"></span>
        <span class="post-date"></span>
      </div>
      <div class="post-content"></div>
    `;
    forumPosts.appendChild(emptyPost);

    // Function to add post to UI
    function addPostToUI(content, authorName, timestamp) {
      const newPost = emptyPost.cloneNode(true);
      newPost.style.display = 'block';
      newPost.classList.remove('template-post');

      newPost.querySelector('.post-author').textContent = authorName;
      newPost.querySelector('.post-date').textContent =
        timestamp.toLocaleString();
      newPost.querySelector('.post-content').textContent = content;

      // Insert at the top of the posts list
      const firstPost = forumPosts.querySelector(
        '.forum-post:not(.template-post)'
      );
      if (firstPost) {
        forumPosts.insertBefore(newPost, firstPost);
      } else {
        forumPosts.insertBefore(newPost, emptyPost);
      }

      // Remove empty state message if it exists
      const emptyState = forumPosts.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }
    }

    // Modify submit button handler
    submitButton?.addEventListener('click', async () => {
      const content = forumInput.value.trim();
      if (!content || content.length === 0) {
        console.log('Empty content, not submitting');
        return;
      }
      if (!auth.currentUser) return;

      try {
        const postId = crypto.randomUUID();
        const timestamp = new Date();

        // Add post to UI immediately
        addPostToUI(
          content,
          auth.currentUser.displayName || 'Anonymous',
          timestamp
        );

        // Create batch for atomic operations
        const batch = writeBatch(db);

        // Add main forum post
        const postRef = doc(collection(db, `forum_posts_${country}`));
        batch.set(postRef, {
          content,
          source_race: forumInput.getAttribute('data-source'),
          id: postId,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: timestamp,
          type: 'race_wall_post',
        });

        // Add to new_posts queue
        const newPostRef = doc(collection(db, 'new_posts'));
        batch.set(newPostRef, {
          source_race: forumInput.getAttribute('data-source'),
          country: country,
          timestamp: timestamp,
        });

        await batch.commit();
        forumInput.value = '';
        console.log('Post submitted successfully');
      } catch (error) {
        console.error('Error posting message:', error);
        // Optionally: Remove the optimistically added post if submission fails
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