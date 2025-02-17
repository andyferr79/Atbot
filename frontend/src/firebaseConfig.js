// E:\\ATBot\\frontend\\src\\firebaseConfig.js - Configurazione Firebase aggiornata per StayPro

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configurazione Firebase con le credenziali esistenti
const firebaseConfig = {
  apiKey: "AIzaSyDtcXEcXxQJqHzQB5Hjat82grMrOMQiwAM",
  authDomain: "autotaskerbot.firebaseapp.com",
  databaseURL:
    "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "autotaskerbot",
  storageBucket: "autotaskerbot.appspot.com",
  messagingSenderId: "791512243939",
  appId: "1:791512243939:web:cee6a57d8fb4f7b5616fd6",
  measurementId: "G-FLJ802DKNQ",
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
