// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyaG6rg8_4j_FV8eBB-2GJXRqqF1phqCs",
  authDomain: "funcall-20971.firebaseapp.com",
  projectId: "funcall-20971",
  storageBucket: "funcall-20971.firebasestorage.app",
  messagingSenderId: "58777716769",
  appId: "1:58777716769:web:f448045d7f7cbac185fb60",
  measurementId: "G-2T2VBVMN2Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
