import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6749kNDGisgKY1qIdUcMsrjSBuqF4Fao",
  authDomain: "crm-app-ea777.firebaseapp.com",
  projectId: "crm-app-ea777",
  storageBucket: "crm-app-ea777.appspot.com",
  messagingSenderId: "174934345835",
  appId: "1:174934345835:web:13358001ab42be191ec92e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage }; 