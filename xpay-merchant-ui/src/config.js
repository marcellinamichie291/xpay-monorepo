// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-B7cau-RhhB0nkE4V-NfBrNngDas6wuQ",
  authDomain: "xpay-bec12.firebaseapp.com",
  projectId: "xpay-bec12",
  storageBucket: "xpay-bec12.appspot.com",
  messagingSenderId: "277189487644",
  appId: "1:277189487644:web:f18a4bbafbe12b304f83d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(app);
export const FIRESTORE_DB = getFirestore(app);