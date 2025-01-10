import { getFirebaseAuth } from './firebaseConfig.js';

class AuthService {
  constructor() {
    this.auth = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    const { auth } = await getFirebaseAuth();
    this.auth = auth;
    this.initialized = true;
  }

  async getAuth() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.auth;
  }
}

export const authService = new AuthService();
