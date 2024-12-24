import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import { Timestamp} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_65TIYlVFlvHdWxUnklJ-SIxZ7qqTd_g",
  authDomain: "library-management-system-smit.firebaseapp.com",
  projectId: "library-management-system-smit",
  storageBucket: "library-management-system-smit.firebasestorage.app",
  messagingSenderId: "761944642976",
  appId: "1:761944642976:web:03f9ffe6055ab36a9e80c5",
  measurementId: "G-KZT8TZFMF3"
};

firebase.initializeApp(firebaseConfig);

export const firestore = firebase.firestore();
export const auth = firebase.auth();
export const storage = firebase.storage(); // Export the 'storage' module

export default firebase;
export { Timestamp};