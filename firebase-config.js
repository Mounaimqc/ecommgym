// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // إذا كنت تحتاج المصادقة

// إعدادات مشروعك من لوحة تحكم فايربيس
const firebaseConfig = {
  apiKey: "AIzaSyD...", 
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456..."
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
// export const auth = getAuth(app); 
