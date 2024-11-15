import { getFirebaseAuth } from './firebaseConfig.js';

class AuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    const { auth, db } = await getFirebaseAuth();
    this.auth = auth;
    this.db = db;
    this.initialized = true;
  }

  async getAuth() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.auth;
  }

  async getDb() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.db;
  }
}

export const authService = new AuthService();
