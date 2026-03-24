import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCR8D82MjVqnflxArpOnOZpOEnThDZ0mdA",
  authDomain: "debatabase-5981b.firebaseapp.com",
  projectId: "debatabase-5981b",
  storageBucket: "debatabase-5981b.firebasestorage.app",
  messagingSenderId: "635437236368",
  appId: "1:635437236368:web:802b2d1a84619ba64b9815",
  measurementId: "G-DVPTZXD8D4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };