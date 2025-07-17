// Firebase Configuration Test Script
// Run this in your browser console or as a separate test

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC6749kNDGisgKY1qIdUcMsrjSBuqF4Fao",
  authDomain: "crm-app-ea777.firebaseapp.com",
  projectId: "crm-app-ea777",
  storageBucket: "crm-app-ea777.appspot.com",
  messagingSenderId: "174934345835",
  appId: "1:174934345835:web:13358001ab42be191ec92e"
};

console.log('Testing Firebase Configuration...');

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  // Test Authentication
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
  
  // Test Firestore
  const db = getFirestore(app);
  console.log('✅ Firestore initialized');
  
  console.log('🎉 All Firebase services are working!');
  
} catch (error) {
  console.error('❌ Firebase configuration error:', error);
}

// Common issues and solutions:
console.log(`
🔧 Common Firebase Setup Issues:

1. Authentication not enabled:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password"

2. Firestore not created:
   - Go to Firebase Console → Firestore Database
   - Click "Create database"
   - Choose "Start in test mode"

3. Storage not enabled:
   - Go to Firebase Console → Storage
   - Click "Get started"
   - Choose "Start in test mode"

4. Security rules too restrictive:
   - Check Firestore and Storage rules
   - Make sure they allow authenticated users
`); 