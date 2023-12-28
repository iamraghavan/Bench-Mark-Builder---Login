import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyD7g-v-s6rF91mPNXtT739oyYVmlLv_ZoI",
  authDomain: "adhitya-builders.firebaseapp.com",
  databaseURL: "https://adhitya-builders-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "adhitya-builders",
  storageBucket: "adhitya-builders.appspot.com",
  messagingSenderId: "1065668990292",
  appId: "1:1065668990292:web:4c432e4307f78b842c24c1",
  measurementId: "G-9VPFEYL792"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);
const storage = getStorage(firebaseApp);

export default firebaseApp;
export { firebaseApp };

export {auth, createUserWithEmailAndPassword, db, storage  };