import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDtcXEcXxQJqHzQB5Hjat82grMrOMQiwAM",
  authDomain: "autotaskerbot.firebaseapp.com",
  databaseURL: "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "autotaskerbot",
  storageBucket: "autotaskerbot.appspot.com",
  messagingSenderId: "791512243939",
  appId: "1:791512243939:web:cee6a57d8fb4f7b5616fd6",
  measurementId: "G-FLJ802DKNQ"
};

const app = initializeApp(firebaseConfig);
export default app;
