// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // إذا كنت تحتاج المصادقة

// إعدادات مشروعك من لوحة تحكم فايربيس
const firebaseConfig = {
  apiKey: "AIzaSyDBZaA_Ah40Edth8FIfqEeleu8s_aWjyFA",
  authDomain: "ecomm-gym.firebaseapp.com",
  projectId: "ecomm-gym",
  storageBucket: "ecomm-gym.firebasestorage.app",
  messagingSenderId: "41274656106",
  appId: "1:41274656106:web:213f714ce5a538c35dd113",
  measurementId: "G-32QCSS0ZBW"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
// export const auth = getAuth(app); 
