import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, setDoc, type Firestore
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, type Auth, type User
} from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";

// Environment variables validation
const validateEnvVars = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_GEMINI_API_KEY'
  ];

  const missing = requiredEnvVars.filter(varName => !import.meta.env[varName]);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    console.error('Please create a .env file based on .env.example');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

validateEnvVars();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

// Initialize Gemini AI
export const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Re-export Firebase functions for convenience
export {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  setDoc,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User
};
