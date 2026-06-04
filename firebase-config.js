// firebase-config.js
//import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
//import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

//const firebaseConfig = {
//  apiKey: "AIzaSyCUcmmnvxjsZoDgQyESi5AvsynnH1kljFc",
//  authDomain: "mounir-40df8.firebaseapp.com",
//  projectId: "mounir-40df8",
//  storageBucket: "mounir-40df8.firebasestorage.app",
//  messagingSenderId: "855089551978",
//  appId: "1:855089551978:web:dfd904eb3788d3504e4813",
//  measurementId: "G-M680BM9Y77"
//};

//const app = initializeApp(firebaseConfig);
//export const db = getFirestore(app);

//console.log("✅ Firebase connecté avec succès!");



// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js"; // ✅ أضف هذا

const firebaseConfig = {
  apiKey: "AIzaSyDBZaA_Ah40Edth8FIfqEeleu8s_aWjyFA",
  authDomain: "ecomm-gym.firebaseapp.com",
  projectId: "ecomm-gym",
  storageBucket: "ecomm-gym.firebasestorage.app",
  messagingSenderId: "41274656106",
  appId: "1:41274656106:web:213f714ce5a538c35dd113",
  measurementId: "G-32QCSS0ZBW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ صدّر storage
