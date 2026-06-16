import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBE27BIg5gfs0Yr6KPElBi5CmEDXIoK8FA",
  authDomain: "forgegaurd.firebaseapp.com",
  projectId: "forgegaurd",
  storageBucket: "forgegaurd.firebasestorage.app",
  messagingSenderId: "880682896672",
  appId: "1:880682896672:web:cdc4a6de52085ac1101b45",
  measurementId: "G-CJ7QNFQY3Y"
};

// Initialize Firebase only if it hasn't been initialized yet (avoids Next.js fast refresh errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
