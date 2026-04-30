// Firebase Configuration for Navithya
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwRCQXILbIMjfbb-zhRXSRJXQHeKrxVkI",
  authDomain: "com-navithya.firebaseapp.com",
  projectId: "com-navithya",
  storageBucket: "com-navithya.firebasestorage.app",
  messagingSenderId: "20630095675",
  appId: "1:20630095675:web:1d74cca4a8e6ccdc58591e",
  measurementId: "G-0NEH12WEBL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
