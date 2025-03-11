import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyAeoRW-7448PppRu2sqXj1uUrUV2pfT8_I",
  authDomain: "promising-saga-232017.firebaseapp.com",
  projectId: "promising-saga-232017",
  storageBucket: "promising-saga-232017.appspot.com",
  messagingSenderId: "577836332495",
  appId: "1:577836332495:web:b9c5aa7212c1c5ffd28eba"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);