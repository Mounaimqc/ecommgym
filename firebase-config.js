// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBZaA_Ah40Edth8FIfqEeleu8s_aWjyFA",
  authDomain: "ecomm-gym.firebaseapp.com",
  projectId: "ecomm-gym",
  storageBucket: "ecomm-gym.firebasestorage.app",
  messagingSenderId: "41274656106",
  appId: "1:41274656106:web:213f714ce5a538c35dd113",
  measurementId: "G-32QCSS0ZBW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
