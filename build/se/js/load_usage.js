import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { getApp } from './firebaseConfig.js';

class Analytics {
  constructor() {
    this.db = getFirestore(getApp());
    this.sessionData = {
      url: window.location.href,
      visitedTimestamp: new Date().toISOString(),
      clicks: {},
      deviceType: this.detectDeviceType(),
      uniqueId: this.generateUniqueId(),
      dailyId: null,
    };

    this.setupEventListeners();
    this.getLocationData();
    this.initializeDailyIdentifier();
  }

  detectDeviceType() {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
    return 'desktop';
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

  async getLocationData() {
    try {
      const response = await fetch(
        'https://api-getlocation-bhro7jtuda-ey.a.run.app'
      );
      const locationData = await response.json();
      this.sessionData.location = locationData;
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A') {
        const id = event.target.id || 'unknown';
        this.sessionData.clicks[id] = (this.sessionData.clicks[id] || 0) + 1;
      }
    });

    window.addEventListener('beforeunload', () => {
      this.sessionData.endTimestamp = new Date().toISOString();
      this.sessionData.sessionLength =
        (new Date(this.sessionData.endTimestamp) -
          new Date(this.sessionData.visitedTimestamp)) /
        1000;
      this.logPageViewToFirestore();
    });
  }

  async logPageViewToFirestore() {
    try {
      const country =
        this.sessionData.location?.country?.toLowerCase() || 'unknown';
      const collection = `pageViews_${country}`;

      const sanitizedData = {
        ...this.sessionData,
        ip: undefined,
        userAgent: navigator.userAgent.split(' ')[0],
      };

      await this.db.collection(collection).add(sanitizedData);
      console.log('Page view logged successfully');
    } catch (error) {
      console.error('Error logging page view:', error);
    }
  }
}

const analytics = new Analytics();