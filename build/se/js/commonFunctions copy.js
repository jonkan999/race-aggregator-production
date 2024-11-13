/* put all common functions here e.g:
cleanFileName(filename) {
    makes everything lower case, replaces dashes and spaces with _ and swaps out åäö->aao
}  */
import { getFirebaseAuth } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

class Analytics {
  constructor() {
    this.sessionData = {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || 'direct',
      visitedTimestamp: new Date().toISOString(),
      clicks: {},
      forms: {}, // Track form interactions
      scrollDepth: 0, // Track how far user scrolls
      deviceType: this.detectDeviceType(),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      uniqueId: this.generateUniqueId(),
      dailyId: null,
      timeOnPage: 0, // Active time
      totalTime: 0, // Total time including hidden
      lastActiveTime: new Date(),
      isVisible: true,
    };

    this.docRef = null;

    this.initialize().catch((error) => {
      console.error('Failed to initialize analytics:', error);
    });
  }

  async initialize() {
    console.log('Initializing analytics...');
    const { db } = await getFirebaseAuth();
    this.db = db;
    console.log('Firebase DB initialized:', !!this.db);

    await this.getLocationData();
    await this.initializeDailyIdentifier();

    await this.createInitialDocument();

    this.setupEventListeners();
    console.log('Initial page view logged');
  }

  async createInitialDocument() {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const country = 'se';
      const collectionPath = `pageViews_${country}`;

      const { ip, ...dataWithoutIp } = this.sessionData;
      const sanitizedData = {
        ...dataWithoutIp,
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

    try {
      const { ip, ...dataWithoutIp } = this.sessionData;
      const updateData = {
        ...dataWithoutIp,
        lastUpdate: new Date(),
        trigger: trigger,
      };

      await updateDoc(this.docRef, updateData);
      console.log('Document updated, trigger:', trigger);
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

    // Track scroll depth
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const scrollPercent =
          (scrollTop / (documentHeight - windowHeight)) * 100;
        this.sessionData.scrollDepth = Math.max(
          this.sessionData.scrollDepth,
          Math.round(scrollPercent)
        );
        this.updateDocument('scroll_update');
      }, 1000);
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

    // Track page unload
    window.addEventListener('beforeunload', async (event) => {
      const now = new Date();
      const activeTimeDiff = this.sessionData.isVisible
        ? (now - new Date(this.sessionData.lastActiveTime)) / 1000
        : 0;

      this.sessionData.endTimestamp = now.toISOString();
      this.sessionData.timeOnPage += activeTimeDiff;
      this.sessionData.totalTime =
        (now - new Date(this.sessionData.visitedTimestamp)) / 1000;

      // Final performance metrics
      if (window.performance) {
        const perf = window.performance;
        this.sessionData.performance = {
          loadTime: perf.timing.loadEventEnd - perf.timing.navigationStart,
          domReady:
            perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart,
          firstPaint: perf.getEntriesByType('paint')[0]?.startTime,
          resourceCount: perf.getEntriesByType('resource').length,
        };
      }

      await this.updateDocument('before_unload');
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

  generateUniqueId() {
    const sessionSalt = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString().slice(-5);
    return btoa(`${sessionSalt}-${timestamp}`);
  }

  async initializeDailyIdentifier() {
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem('analytics_daily');
    const stored = storedData ? JSON.parse(storedData) : {};

    if (!stored.date || stored.date !== today) {
      stored.date = today;
      stored.salt = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('analytics_daily', JSON.stringify(stored));
    }

    try {
      const response = await fetch(
        'https://api-getlocation-bhro7jtuda-ey.a.run.app'
      );
      const { ip } = await response.json();

      const dailyIdentifier = await this.hashData(`${ip}-${stored.salt}`);
      this.sessionData.dailyId = dailyIdentifier;
    } catch (error) {
      console.error('Error generating daily identifier:', error);
      this.sessionData.dailyId = 'unknown';
    }
  }

  async hashData(data) {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
      const endpoint =
        'http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city';

      const response = await fetch(endpoint);
      console.log('Location API response status:', response.status);

      const locationData = await response.json();
      console.log('Location data received:', locationData);

      if (locationData.status === 'success') {
        this.sessionData.location = {
          country: locationData.country,
          countryCode: locationData.countryCode,
          region: locationData.regionName,
          city: locationData.city,
        };
        console.log('Location data set:', this.sessionData.location);
      } else {
        console.warn('Location API error:', locationData.message);
        this.sessionData.location = {
          country: 'unknown',
          countryCode: 'unknown',
          region: 'unknown',
          city: 'unknown',
        };
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      this.sessionData.location = {
        country: 'unknown',
        countryCode: 'unknown',
        region: 'unknown',
        city: 'unknown',
      };
    }
  }
}

const analytics = new Analytics();
export default analytics;