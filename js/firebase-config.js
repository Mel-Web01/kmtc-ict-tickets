// Import Firebase functions we need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your project's unique Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0ScCf7pY3qX7hUM_DqLheZT-HP-FgEU4",
  authDomain: "kmtc-cbea5.firebaseapp.com",
  projectId: "kmtc-cbea5",
  storageBucket: "kmtc-cbea5.firebasestorage.app",
  messagingSenderId: "752646953479",
  appId: "1:752646953479:web:841cede96d6eaf41ffa8a2"
};

// Initialize Firebase with your config
const app = initializeApp(firebaseConfig);

// Initialize Firestore (the database) and export it so other files can use it
export const db = getFirestore(app);