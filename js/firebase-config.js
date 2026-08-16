import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0ScCf7pY3qX7hUM_DqLheZT-HP-FgEU4",
  authDomain: "kmtc-cbea5.firebaseapp.com",
  projectId: "kmtc-cbea5",
  storageBucket: "kmtc-cbea5.firebasestorage.app",
  messagingSenderId: "752646953479",
  appId: "1:752646953479:web:841cede96d6eaf41ffa8a2"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);