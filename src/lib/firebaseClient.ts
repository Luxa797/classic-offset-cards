// src/lib/firebaseClient.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// உங்கள் Firebase திட்டத்தின் விவரங்கள்.
const firebaseConfig = {
  apiKey: "AIzaSyBqbrtGmDkzKNpyMpAYp57CYfvZxSCwuWE",
  authDomain: "classic-offset-cards.firebaseapp.com",
  projectId: "classic-offset-cards",
  storageBucket: "classic-offset-cards.appspot.com",
  messagingSenderId: "723894732778",
  appId: "1:723894732778:web:524ff4af317750fe14d493"
};

// Firebase-ஐ தொடங்குதல்
const app = initializeApp(firebaseConfig);

// Firestore சேவையைப் பெறுதல்
const db = getFirestore(app);

export { db };
