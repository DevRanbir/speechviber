import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4_LUIiPZBoYqldbIvFjZCoclRT-Zt_6I",
  authDomain: "speechviber.firebaseapp.com",
  databaseURL: "https://speechviber-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "speechviber",
  storageBucket: "speechviber.appspot.com",
  messagingSenderId: "360160284654",
  appId: "1:360160284654:web:3d4a4031065eefeee888ff",
  measurementId: "G-FJVD7KXJC6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };