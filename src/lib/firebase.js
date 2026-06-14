// Firebase web client. These config values are public identifiers, not secrets;
// data access is governed by Firestore/Storage security rules.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2WvtITUdePRPfsocpzJApDqZkjJEpaBA",
  authDomain: "troop650.firebaseapp.com",
  projectId: "troop650",
  storageBucket: "troop650.firebasestorage.app",
  messagingSenderId: "534573832659",
  appId: "1:534573832659:web:207b5fdb08b8d8ec507726",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
