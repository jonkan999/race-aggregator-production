import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDJC1Lb7bLcSyVt6dhiqy_QA8W-f2dlcjk',
  authDomain: 'aggregatory-440306.firebaseapp.com',
  projectId: 'aggregatory-440306',
  storageBucket: 'aggregatory-440306.firebasestorage.app',
  messagingSenderId: '353622401342',
  appId: '1:353622401342:web:c5d687352018fc621ecc6f',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
