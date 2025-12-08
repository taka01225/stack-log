import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// getStorage は削除します

const firebaseConfig = {
  apiKey: "AIzaSyBO_Epnlhw_7RlJObsM8ozsaDiNV_oR5jM",
  authDomain: "blog-3db83.firebaseapp.com",
  projectId: "blog-3db83",
  storageBucket: "blog-3db83.firebasestorage.app",
  messagingSenderId: "655901483080",
  appId: "1:655901483080:web:81e5a67f91be8d5fbe787d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
// const storage = ... も削除

export { auth, provider, db };