import { authService } from './firebaseAuthService.js';
import {
  collection,
  addDoc,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const container = document.querySelector('.forum-container');
const categorySlug = container.getAttribute('data-category');
const threadId = container.getAttribute('data-thread-id');
const country = '{{country_code}}';

export function initializeForum() {
  const threadInputContainer = document.getElementById(
    'thread-input-container'
  );
  const threadInput = document.getElementById('thread-input');
  const threadTitleInput = document.getElementById('thread-title-input');
  const submitButton = document.getElementById('thread-submit');
  const loginPrompt = document.getElementById('login-prompt');

  async function initialize() {
    const auth = await authService.getAuth();
    const db = await authService.getDb();

    // Handle thread input container clicks for login
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

    // Update UI based on auth state
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

        // Create thread post
        const forumRef = collection(db, `forum_posts_${country}`);
        await addDoc(forumRef, {
          type: 'thread',
          threadId: threadId,
          categorySlug: categorySlug,
          title: title,
          content: content,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: timestamp,
          updatedAt: timestamp,
          replyCount: 0,
        });

        // Remove empty state if it exists
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
          emptyState.remove();
        }

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
          <h3>${'{{ forum.thread_created_title }}'}</h3>
          <p>${'{{ forum.thread_created_message }}'}</p>
          <a href="/{{ navigation.forum | slugify(country_code) }}/${categorySlug}/index.html" class="back-link">
            ${'{{ forum.thread_created_back_link }}'}
          </a>
        `;

        threadInputContainer.innerHTML = '';
        threadInputContainer.appendChild(successMessage);
      } catch (error) {
        console.error('Error creating thread:', error);
      }
    });

    const expandBtn = document.querySelector('.expand-threads-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        const expandedThreads = document.querySelector('.threads-expanded');
        const showMoreText = expandBtn.querySelector('.show-more');
        const showLessText = expandBtn.querySelector('.show-less');
        const countIndicator = document.querySelector(
          '.thread-count-indicator'
        );
        const totalThreads = document.querySelectorAll('.thread-card').length;

        // Toggle visibility state
        const isExpanding = expandedThreads.classList.contains('hidden');

        if (isExpanding) {
          // Expanding
          expandedThreads.classList.remove('hidden');
          // Temporarily remove transition to measure height
          expandedThreads.style.transition = 'none';
          expandedThreads.style.maxHeight = 'none';
          const naturalHeight = expandedThreads.offsetHeight;
          expandedThreads.style.maxHeight = '0';

          // Force browser reflow
          expandedThreads.offsetHeight;

          // Re-enable transition and set final height
          expandedThreads.style.transition = 'max-height 0.3s ease-out';
          expandedThreads.style.maxHeight = naturalHeight + 'px';
        } else {
          // Collapsing
          expandedThreads.style.maxHeight = '0';
          // Add hidden class after transition
          expandedThreads.addEventListener(
            'transitionend',
            function handler() {
              expandedThreads.classList.add('hidden');
              expandedThreads.removeEventListener('transitionend', handler);
            },
            { once: true }
          );
        }

        // Toggle button text
        showMoreText.classList.toggle('hidden');
        showLessText.classList.toggle('hidden');

        // Update count text
        const showingText = countIndicator.dataset.showingText;
        countIndicator.textContent = showingText
          .replace('{x}', isExpanding ? totalThreads.toString() : '3')
          .replace('{y}', totalThreads.toString());
      });
    }
  }

  initialize().catch(console.error);
}

export function initializeForumThread() {
  const forumInputContainer = document.getElementById('forum-input-container');
  const forumInput = document.getElementById('forum-input');
  const submitButton = document.getElementById('forum-submit');
  const loginPrompt = document.getElementById('login-prompt');

  async function initialize() {
    const auth = await authService.getAuth();
    const db = await authService.getDb();

    // Handle input container clicks for login
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

    // Create template post element
    const forumPosts = document.querySelector('.forum-posts');
    const templatePost = document.createElement('div');
    templatePost.className = 'forum-post template-post';
    templatePost.style.display = 'none';
    templatePost.innerHTML = `
      <div class="post-header">
        <span class="post-author"></span>
        <span class="post-date"></span>
      </div>
      <div class="post-content"></div>
    `;
    forumPosts?.appendChild(templatePost);

    // Update UI based on auth state
    auth.onAuthStateChanged((user) => {
      if (forumInput) {
        forumInput.disabled = !user;
        forumInput.style.pointerEvents = user ? 'auto' : 'none';
        forumInput.style.cursor = user ? 'auto' : 'pointer';
        submitButton.style.display = user ? 'block' : 'none';
        loginPrompt.style.display = user ? 'none' : 'block';
      }
    });

    // Add post to UI
    function addPostToUI(content, authorName, timestamp) {
      const newPost = templatePost.cloneNode(true);
      newPost.style.display = 'block';
      newPost.classList.remove('template-post');

      newPost.querySelector('.post-author').textContent = authorName;
      newPost.querySelector('.post-date').textContent =
        timestamp.toLocaleString();
      newPost.querySelector('.post-content').textContent = content;

      forumPosts.insertBefore(newPost, templatePost);

      // Remove empty state if it exists
      const emptyState = forumPosts.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }
    }

    // Handle post submission
    submitButton?.addEventListener('click', async () => {
      const content = forumInput.value.trim();
      if (!content || !auth.currentUser) return;

      try {
        const timestamp = new Date();

        // Add post optimistically to UI
        addPostToUI(
          content,
          auth.currentUser.displayName || 'Anonymous',
          timestamp
        );

        // Find the thread post to update its replyCount
        const threadQuery = query(
          collection(db, `forum_posts_${country}`),
          where('threadId', '==', threadId),
          where('type', '==', 'thread')
        );
        const threadSnapshot = await getDocs(threadQuery);
        const threadDoc = threadSnapshot.docs[0];

        // Create reply post
        const forumRef = collection(db, `forum_posts_${country}`);
        await addDoc(forumRef, {
          type: 'reply',
          threadId: threadId,
          categorySlug: categorySlug,
          content: content,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          createdAt: timestamp,
        });

        // Update thread's replyCount and updatedAt
        await updateDoc(threadDoc.ref, {
          replyCount: (threadDoc.data().replyCount || 0) + 1,
          updatedAt: timestamp,
        });

        forumInput.value = '';
      } catch (error) {
        console.error('Error posting reply:', error);
      }
    });
  }

  initialize().catch(console.error);
}

// Initialize based on page type
document.addEventListener('DOMContentLoaded', () => {
  const isThreadPage = document.querySelector('.forum-posts');
  const isCategoryPage = document.querySelector('.thread-input-container');

  if (isThreadPage) {
    initializeForumThread();
  } else if (isCategoryPage) {
    initializeForum();
  }
});
