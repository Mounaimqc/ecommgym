// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBZaA_Ah40Edth8FIfqEeleu8s_aWjyFA",
  authDomain: "ecomm-gym.firebaseapp.com",
  projectId: "ecomm-gym",
  storageBucket: "ecomm-gym.firebasestorage.app",
  messagingSenderId: "41274656106",
  appId: "1:41274656106:web:213f714ce5a538c35dd113",
  measurementId: "G-32QCSS0ZBW"
};

// تهيئة فايربيس
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, analytics };
