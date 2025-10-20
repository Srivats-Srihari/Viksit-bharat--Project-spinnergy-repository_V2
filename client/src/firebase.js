// Firebase config - update if you want different project
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6zQJ_yCrZgrTT6NjY_jwG8fmc8WmoOqg",
  authDomain: "spinnergy-13b7e.firebaseapp.com",
  projectId: "spinnergy-13b7e",
  storageBucket: "spinnergy-13b7e.appspot.com",
  messagingSenderId: "597220616891",
  appId: "1:597220616891:web:0000000000000000000000"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);