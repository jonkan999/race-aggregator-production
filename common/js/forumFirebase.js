import { authService } from './firebaseAuthService.js';
import {
  collection,
  addDoc,
  doc,
  writeBatch,
  increment,
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
  const country = '{{ country_code }}';
  console.log(country);
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

        // Create proper collection reference for the category
        const categoryRef = collection(
          db,
          `forum_posts_${country}`,
          categorySlug,
          'threads'
        );

        // Add thread info
        const threadRef = doc(categoryRef, threadId);
        batch.set(threadRef, {
          title,
          slug: threadId, // Adding slug for URL construction
          content,
          categorySlug, // Store category for reference
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: timestamp,
          updatedAt: timestamp,
          postCount: 1,
        });

        // Add initial post to thread's posts subcollection
        const postsRef = collection(threadRef, 'posts');
        const initialPostRef = doc(postsRef);
        batch.set(initialPostRef, {
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

export function initializeForumThread() {
  console.log('Starting forum thread initialization...');

  const forumInputContainer = document.getElementById('forum-input-container');
  const forumInput = document.getElementById('forum-input');
  const submitButton = document.getElementById('forum-submit');
  const loginPrompt = document.getElementById('login-prompt');
  const country = document.body.getAttribute('data-country');
  const categorySlug = document.body.getAttribute('data-category');
  const threadId = forumInput?.getAttribute('data-thread-id');

  async function initialize() {
    console.log('Initializing forum thread...');
    const auth = await authService.getAuth();
    const db = await authService.getDb();

    // Handle input container clicks
    if (forumInputContainer) {
      forumInputContainer.addEventListener('click', () => {
        if (!auth.currentUser) {
          const loginContainer = document.querySelector('.login-container');
          if (loginContainer) {
            loginContainer.click();
          }
        }
      });
    }

    // Add template post element
    const forumPosts = document.querySelector('.forum-posts');
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
    forumPosts?.appendChild(emptyPost);

    // Function to add post to UI
    function addPostToUI(content, authorName, timestamp) {
      const newPost = emptyPost.cloneNode(true);
      newPost.style.display = 'block';
      newPost.classList.remove('template-post');

      newPost.querySelector('.post-author').textContent = authorName;
      newPost.querySelector('.post-date').textContent =
        timestamp.toLocaleString();
      newPost.querySelector('.post-content').textContent = content;

      // Insert at the bottom of the posts list
      forumPosts.insertBefore(newPost, emptyPost);

      // Remove empty state if it exists
      const emptyState = forumPosts.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }
    }

    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      if (forumInput) {
        forumInput.disabled = !user;
        forumInput.style.pointerEvents = user ? 'auto' : 'none';
        forumInput.style.cursor = user ? 'auto' : 'pointer';
        submitButton.style.display = user ? 'block' : 'none';
        loginPrompt.style.display = user ? 'none' : 'block';
      }
    });

    // Handle post submission
    submitButton?.addEventListener('click', async () => {
      const content = forumInput.value.trim();
      if (!content || !auth.currentUser) return;

      try {
        const timestamp = new Date();

        // Add post to UI immediately
        addPostToUI(
          content,
          auth.currentUser.displayName || 'Anonymous',
          timestamp
        );

        // Create batch for atomic operations
        const batch = writeBatch(db);

        // Add post to thread
        const threadRef = doc(
          db,
          `forum_posts_${country}`,
          categorySlug,
          threadId
        );
        const postRef = doc(collection(threadRef, 'posts'));

        batch.set(postRef, {
          content,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: timestamp,
        });

        // Update thread's post count and last update time
        batch.update(threadRef, {
          postCount: increment(1),
          updatedAt: timestamp,
        });

        await batch.commit();
        forumInput.value = '';
      } catch (error) {
        console.error('Error posting reply:', error);
        // Optionally: Remove the optimistically added post if submission fails
      }
    });
  }

  // Initialize and handle errors
  initialize().catch((error) => {
    console.error('Failed to initialize forum thread:', error);
  });
}

// Initialize appropriate functionality based on page type
document.addEventListener('DOMContentLoaded', () => {
  const isThreadPage = document.querySelector('.forum-posts');
  if (isThreadPage) {
    initializeForumThread();
  } else {
    initializeForum();
  }
});
