import { getFirebaseAuth } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const isLocalEnvironment =
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost';

const country = '{{country_code}}';

class Analytics {
  constructor() {
    this.sessionData = {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || 'direct',
      visitedTimestamp: new Date().toISOString(),
      clicks: {},
      forms: {},
      scrollDepth: 0,
      scrollMilestones: [],
      scrollEvents: 0,
      scrollDirections: {
        up: 0,
        down: 0,
      },
      deviceType: this.detectDeviceType(),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      uniqueId: crypto.randomUUID(),
      dailyId: null,
      timeOnPage: 0,
      totalTime: 0,
      lastActiveTime: new Date(),
      isVisible: true,
    };

    this.initialized = false;
    this.docRef = null;
    this.projectId = 'aggregatory-440306';
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;

    // Add queue management from old version
    this.updateQueue = [];
    this.queueSize = 0;
    this.maxQueueSize = 15;
    this.baseInterval = 10000;
    this.maxInterval = 300000;
    this.sessionStart = new Date();
    this.currentInterval = this.baseInterval;
    this.lastUpdate = new Date();
  }

  async initialize() {
    if (this.initialized) return;

    if (isLocalEnvironment) {
      console.log('Local environment detected. Analytics disabled.');
      return;
    }

    try {
      // Only initialize db connection when needed
      this.db = null;
      await this.createInitialDocument();
      this.setupEventListeners();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  async createInitialDocument() {
    if (isLocalEnvironment) return;

    try {
      const collectionPath = `pageViews_${country}`;

      const sanitizedData = {
        fields: this.convertToFirestoreFormat({
          ...this.sessionData,
          timestamp: new Date(),
          trigger: 'page_view',
        }),
      };

      const response = await fetch(`${this.baseUrl}/${collectionPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      const result = await response.json();
      this.docId = result.name.split('/').pop();
      this.collectionPath = collectionPath;
    } catch (error) {
      console.error('Error creating initial document:', error);
    }
  }

  async updateDocument(trigger) {
    if (isLocalEnvironment || !this.docId) return;

    // Add event to queue
    this.updateQueue.push(trigger);
    this.queueSize++;

    const now = new Date();
    const timeSinceLastUpdate = now - this.lastUpdate;
    const currentInterval = this.getUpdateInterval();

    // Calculate total time
    const totalTime =
      (now - new Date(this.sessionData.visitedTimestamp)) / 1000;
    const activeTimeDiff = this.sessionData.isVisible
      ? (now - new Date(this.sessionData.lastActiveTime)) / 1000
      : 0;

    // Critical events that should update immediately
    const criticalEvents = ['form_submit', 'before_unload', 'error_logged'];

    const shouldUpdate =
      timeSinceLastUpdate > currentInterval ||
      this.queueSize >= this.maxQueueSize ||
      criticalEvents.includes(trigger);

    if (!shouldUpdate) return;

    try {
      const updateData = {
        ...this.sessionData,
        lastUpdate: now.toISOString(),
        lastTrigger: trigger,
        recentTriggers: this.updateQueue,
        timeOnPage: this.sessionData.timeOnPage + activeTimeDiff,
        totalTime: totalTime,
      };

      await fetch(`${this.baseUrl}/${this.collectionPath}/${this.docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: this.convertToFirestoreFormat(updateData),
        }),
      });

      // Update the sessionData with new accumulated time
      this.sessionData.timeOnPage = updateData.timeOnPage;
      this.sessionData.lastActiveTime = now;

      // Reset queue
      this.updateQueue = [];
      this.queueSize = 0;
      this.lastUpdate = now;
    } catch (error) {
      console.error('Error updating document:', error);
    }
  }

  // Helper method to convert data to Firestore format
  convertToFirestoreFormat(data) {
    // Implement conversion logic here
    // This is a simplified example
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = {
        stringValue: String(value),
      };
    }
    return converted;
  }

  async generateVisitorId() {
    try {
      const { db } = await getFirebaseAuth();
      const today = new Date().toISOString().split('T')[0];
      const saltDoc = await this.getDailySalt(db, today);

      // Use temporarily stored IP (from getLocationData)
      const siteOrigin = window.location.origin;
      const userAgent = navigator.userAgent;
      const clientIP = this._tempIP || 'unknown';
      console.log('Client IP:', clientIP);
      const sessionData = `${siteOrigin}${clientIP}${userAgent}${saltDoc.salt}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(sessionData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dailyId = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      this.sessionData.dailyId = dailyId;

      // Clean up temporary IP
      delete this._tempIP;

      console.log('Visitor ID generated');
    } catch (error) {
      console.error('Error generating visitor ID:', error);
      this.sessionData.dailyId = 'unknown';
      // Clean up temporary IP even on error
      delete this._tempIP;
    }
  }

  async getDailySalt(db, date) {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/aggregatory-440306/databases/(default)/documents/dailySalts?where=date=${date}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (data && data.documents && data.documents.length > 0) {
        return data.documents[0].fields;
      }

      // Fallback to random salt
      const randomSalt =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      return {
        salt: randomSalt,
        date: date,
      };
    } catch (error) {
      console.error('Error fetching salt:', error);
      return {
        salt: crypto.randomUUID(),
        date: date,
      };
    }
  }

  setupEventListeners() {
    // Track clicks with more detail
    document.addEventListener('click', async (event) => {
      const target = event.target;
      const id =
        target.id ||
        target.closest('button, a, [data-analytics]')?.id ||
        'unknown';
      const clickData = {
        count: (this.sessionData.clicks[id]?.count || 0) + 1,
        lastClicked: new Date().toISOString(),
        type: target.tagName.toLowerCase(),
        text: target.textContent?.slice(0, 50) || '',
        href: target.href || target.closest('a')?.href || null,
      };
      this.sessionData.clicks[id] = clickData;

      if (target.type === 'submit' || target.closest('form')) {
        await this.updateDocument('form_submission');
      } else {
        await this.updateDocument('click');
      }
    });

    // Track form interactions
    document.addEventListener('submit', async (event) => {
      const form = event.target;
      const formId = form.id || 'unknown_form';
      this.sessionData.forms[formId] = {
        submitted: (this.sessionData.forms[formId]?.submitted || 0) + 1,
        lastSubmit: new Date().toISOString(),
      };
      await this.updateDocument('form_submit');
    });

    // Scroll tracking with debouncing
    let lastScrollTop = 0;
    let scrollTimeout;
    let scrollUpdatePending = false;

    document.addEventListener(
      'scroll',
      () => {
        const currentScroll = window.scrollY;
        const scrollPercent = Math.round(
          ((window.scrollY + window.innerHeight) /
            document.documentElement.scrollHeight) *
            100
        );

        // Update counts immediately in memory
        if (currentScroll > lastScrollTop) {
          this.sessionData.scrollDirections.down++;
        } else if (currentScroll < lastScrollTop) {
          this.sessionData.scrollDirections.up++;
        }
        lastScrollTop = currentScroll;
        this.sessionData.scrollEvents++;

        // Only update on reaching new milestones
        if (scrollPercent > this.sessionData.scrollDepth) {
          this.sessionData.scrollDepth = scrollPercent;
          if (
            scrollPercent % 25 === 0 &&
            !this.sessionData.scrollMilestones.includes(scrollPercent)
          ) {
            this.sessionData.scrollMilestones.push(scrollPercent);

            // Debounce the Firestore update
            if (!scrollUpdatePending) {
              scrollUpdatePending = true;
              clearTimeout(scrollTimeout);
              scrollTimeout = setTimeout(() => {
                this.updateDocument('scroll_milestone');
                scrollUpdatePending = false;
              }, 2000);
            }
          }
        }
      },
      { passive: true }
    );

    // Track visibility and active time
    document.addEventListener('visibilitychange', () => {
      const now = new Date();
      const timeDiff = (now - new Date(this.sessionData.lastActiveTime)) / 1000;

      if (document.visibilityState === 'hidden') {
        this.sessionData.isVisible = false;
        this.sessionData.timeOnPage += timeDiff;
      } else {
        this.sessionData.isVisible = true;
        this.sessionData.lastActiveTime = now.toISOString();
      }

      this.updateDocument('visibility_change');
    });

    // Simplified beforeunload handler
    window.addEventListener('beforeunload', async () => {
      console.log('Page unloading...');
      const now = new Date();
      const activeTimeDiff = this.sessionData.isVisible
        ? (now - new Date(this.sessionData.lastActiveTime)) / 1000
        : 0;

      const finalData = {
        ...this.sessionData,
        trigger: 'before_unload',
        endTimestamp: now.toISOString(),
        timeOnPage: this.sessionData.timeOnPage + activeTimeDiff,
        totalTime: (now - new Date(this.sessionData.visitedTimestamp)) / 1000,
      };

      try {
        await fetch(`${this.baseUrl}/${this.collectionPath}/${this.docId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: this.convertToFirestoreFormat(finalData),
          }),
        });
      } catch (error) {
        console.error('Error in final update:', error);
      }
    });

    // Track errors
    window.addEventListener('error', (event) => {
      if (!this.sessionData.errors) this.sessionData.errors = [];
      this.sessionData.errors.push({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        timestamp: new Date().toISOString(),
      });
      this.updateDocument('error_logged');
    });
  }

  detectDeviceType() {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  async getLocationData() {
    try {
      console.log('Fetching location data...');
      let ip = 'unknown';
      // let locationData = null;

      // Try to get IP first
      try {
        ip = await new Promise((resolve, reject) => {
          window._getIPCallback = (json) => {
            if (json && json.ip) {
              resolve(json.ip);
            } else {
              reject(new Error('Invalid IP response'));
            }
            delete window._getIPCallback; // Cleanup
          };

          const script = document.createElement('script');
          script.onerror = () => reject(new Error('Failed to load IP script'));
          script.src =
            'https://api.ipify.org?format=jsonp&callback=_getIPCallback';
          document.head.appendChild(script);
          script.onload = () => document.head.removeChild(script);

          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('IP fetch timeout')), 5000);
        });
      } catch (ipError) {
        console.warn('Failed to fetch IP:', ipError);
      }

      /* // Try to get location data
      try {
        const endpoint =
          'http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName';
        const response = await fetch(endpoint);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        locationData = await response.json();
      } catch (locationError) {
        console.warn('Failed to fetch location:', locationError);
      } */

      // Set session data based on what we got
      /* if (locationData && locationData.status === 'success') {
        this.sessionData.location = {
          country: locationData.country,
          countryCode: locationData.countryCode,
          region: locationData.regionName,
        };
        this._tempIP = ip;
        console.log('Location data set:', this.sessionData.location);
      } else { */
      console.warn('Using fallback location data');
      this.sessionData.location = {
        country: 'unknown',
        countryCode: 'unknown',
        region: 'unknown',
      };
      this._tempIP = ip; // Still use IP if we got it
      // }
    } catch (error) {
      console.error('Error in getLocationData:', error);
      this.sessionData.location = {
        country: 'unknown',
        countryCode: 'unknown',
        region: 'unknown',
      };
      this._tempIP = 'unknown';
    } finally {
      // Clean up any remaining callback
      if (window._getIPCallback) {
        delete window._getIPCallback;
      }
    }
  }

  getScrollEngagement() {
    const totalScrolls = this.sessionData.scrollEvents;
    const upScrolls = this.sessionData.scrollDirections.up;
    const downScrolls = this.sessionData.scrollDirections.down;

    return {
      totalScrolls,
      uniqueMilestones: this.sessionData.scrollMilestones.length,
      scrollRatio: upScrolls / downScrolls, // Higher ratio = more re-reading
      averageScrollsPerMilestone:
        totalScrolls / Math.max(1, this.sessionData.scrollMilestones.length),
      milestoneDetails: this.sessionData.scrollMilestones,
      scrollPatterns: {
        up: upScrolls,
        down: downScrolls,
      },
    };
  }

  cleanup() {
    // Force close any pending requests
    if (this.pendingRequests) {
      this.pendingRequests.forEach((controller) => controller.abort());
    }
    this.pendingRequests = [];
    this.initialized = false;
    this.docRef = null;

    // Remove all listeners
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    window.removeEventListener(
      'visibilitychange',
      this.visibilityChangeHandler
    );
    window.removeEventListener('error', this.errorHandler);
  }

  getUpdateInterval() {
    const timeOnPage = (new Date() - this.sessionStart) / 1000;

    if (timeOnPage > 300) {
      return this.maxInterval; // 5 minutes
    } else if (timeOnPage > 60) {
      return 30000; // 30 seconds
    }
    return this.baseInterval; // 10 seconds
  }
}

// Create the instance but don't initialize yet
const analytics = new Analytics();

export default analytics;
