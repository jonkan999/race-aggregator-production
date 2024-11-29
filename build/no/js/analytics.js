import { getFirebaseAuth } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

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

    this.docRef = null;

    // Add update queue and timing controls
    this.updateQueue = [];
    this.lastUpdate = new Date();
    this.queueSize = 0;
    this.maxQueueSize = 15;

    // Adaptive timing controls
    this.baseInterval = 10000; // Start at 10 seconds
    this.maxInterval = 300000; // Max 5 minutes
    this.sessionStart = new Date();
    this.currentInterval = this.baseInterval;

    this.initialize().catch((error) => {
      console.error('Failed to initialize analytics:', error);
    });
  }

  getUpdateInterval() {
    const timeOnPage = (new Date() - this.sessionStart) / 1000;

    if (timeOnPage > 300) {
      // After 5 minutes
      return this.maxInterval; // Use max interval (30s)
    } else if (timeOnPage > 60) {
      // After 2 minutes
      return 30000; // Use 30 seconds
    }

    return this.baseInterval; // Use base interval (10s)
  }

  async initialize() {
    console.log('Initializing analytics...');
    const { db } = await getFirebaseAuth();
    this.db = db;
    console.log('Firebase DB initialized:', !!this.db);

    await this.getLocationData();
    await this.generateVisitorId();

    await this.createInitialDocument();

    this.setupEventListeners();
    console.log('Initial page view logged');
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
    const saltCollection = collection(db, 'dailySalts');
    const saltQuery = query(saltCollection, where('date', '==', date));
    const snapshot = await getDocs(saltQuery);

    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }

    // If no salt found, randomize (shouldn't happen if cloud function is working)
    console.error('No salt found for date:', date);
    const randomSalt =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    return {
      salt: randomSalt,
      date: date,
    };
  }

  async createInitialDocument() {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const country = 'se';
      const collectionPath = `pageViews_${country}`;

      const sanitizedData = {
        ...this.sessionData,
        userAgent: navigator.userAgent.split(' ')[0],
        timestamp: new Date(),
        trigger: 'page_view',
      };

      this.docRef = await addDoc(
        collection(this.db, collectionPath),
        sanitizedData
      );
      console.log('Initial document created with ID:', this.docRef.id);
    } catch (error) {
      console.error('Error creating initial document:', error);
    }
  }

  async updateDocument(trigger) {
    if (!this.db || !this.docRef) {
      console.error('Database or document reference not initialized');
      return;
    }

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

    if (!shouldUpdate) {
      return;
    }

    try {
      const updateData = {
        ...this.sessionData,
        lastUpdate: now,
        lastTrigger: trigger,
        recentTriggers: this.updateQueue,
        timeOnPage: this.sessionData.timeOnPage + activeTimeDiff,
        totalTime: totalTime,
      };

      await updateDoc(this.docRef, updateData);
      console.log('Document updated:', {
        triggers: this.updateQueue,
        interval: currentInterval / 1000 + 's',
        queueSize: this.queueSize,
        totalTime: Math.round(totalTime) + 's',
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
      console.log('Click tracked:', id, clickData);

      if (target.type === 'submit' || target.closest('form')) {
        await this.updateDocument('form_submission');
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

    // Simplified scroll tracking
    let lastScrollTop = 0;
    let scrollTimeout;
    let scrollUpdatePending = false;

    document.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;

      // Update counts immediately in memory
      if (currentScroll > lastScrollTop) {
        this.sessionData.scrollDirections.down++;
      } else if (currentScroll < lastScrollTop) {
        this.sessionData.scrollDirections.up++;
      }
      lastScrollTop = currentScroll;
      this.sessionData.scrollEvents++;

      // Debounce the Firestore update
      if (!scrollUpdatePending) {
        scrollUpdatePending = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.updateDocument('scroll_batch');
          scrollUpdatePending = false;
        }, 2000); // Wait 2 seconds after last scroll
      }
    });

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
        await updateDoc(this.docRef, finalData);
        console.log('Final update completed');
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

      // Get IP first using ipify
      const ipPromise = new Promise((resolve) => {
        window._getIPCallback = (json) => {
          resolve(json.ip);
          delete window._getIPCallback; // Cleanup
        };

        const script = document.createElement('script');
        script.src =
          'https://api.ipify.org?format=jsonp&callback=_getIPCallback';
        document.head.appendChild(script);
        script.onload = () => document.head.removeChild(script); // Cleanup
      });

      // Get location data
      const endpoint =
        'http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName';
      const [ip, locationResponse] = await Promise.all([
        ipPromise,
        fetch(endpoint),
      ]);

      const locationData = await locationResponse.json();
      console.log('Location data received:', locationData);

      if (locationData.status === 'success') {
        // Store location data (without IP)
        this.sessionData.location = {
          country: locationData.country,
          countryCode: locationData.countryCode,
          region: locationData.regionName,
        };
        // Store IP temporarily for visitor ID generation
        this._tempIP = ip;
        console.log('Location data set:', this.sessionData.location);
      } else {
        console.warn('Location API error:', locationData.message);
        this.sessionData.location = {
          country: 'unknown',
          countryCode: 'unknown',
          region: 'unknown',
        };
        this._tempIP = 'unknown';
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      this.sessionData.location = {
        country: 'unknown',
        countryCode: 'unknown',
        region: 'unknown',
      };
      this._tempIP = 'unknown';
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
}

const analytics = new Analytics();
export default analytics;