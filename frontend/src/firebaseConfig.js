// E:/ATBot/frontend/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  /* ⇩ nuovo */ connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  /* ⇩ nuovo */ connectFirestoreEmulator,
} from "firebase/firestore";
import { getPerformance } from "firebase/performance";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ??
    process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ??
    process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ??
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// ───────────────────────────────────────────────────────────
// Init Firebase
// ───────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const perf = getPerformance(app);

// ───────────────────────────────────────────────────────────
// ⇩  Collega gli emulatori SOLO in ambiente di sviluppo
// ───────────────────────────────────────────────────────────
if (import.meta.env.MODE !== "production" && !window.Cypress) {
  // Auth emulator → porta 9099 (vedi firebase.json)
  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });

  // (Opzionale) Firestore emulator → porta 8080
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export { app, auth, db, googleProvider, perf };
