import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/database";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs,orderBy, query, where, Timestamp, addDoc, doc, updateDoc, getDoc} from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyC_65TIYlVFlvHdWxUnklJ-SIxZ7qqTd_g",
  authDomain: "library-management-system-smit.firebaseapp.com",
  projectId: "library-management-system-smit",
  storageBucket: "library-management-system-smit.firebasestorage.app",
  messagingSenderId: "761944642976",
  appId: "1:761944642976:web:03f9ffe6055ab36a9e80c5",
  measurementId: "G-KZT8TZFMF3"
};

export default firebase;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, query,orderBy, where, app, Timestamp, addDoc, doc, updateDoc, getDoc};