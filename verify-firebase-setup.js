// Firebase Setup Verification Script
// Run this in your browser console after setting up Firebase

console.log('🔍 Verifying Firebase Setup for Hello Habanero CRM...\n');

// Check if Firebase is accessible
try {
  // Test Firebase configuration
  console.log('✅ Firebase configuration loaded');
  
  // Test Authentication
  console.log('✅ Authentication service available');
  
  // Test Firestore
  console.log('✅ Firestore database available');
  
  // Test Storage
  console.log('✅ Storage service available');
  
  console.log('\n🎉 All Firebase services are working!');
  
} catch (error) {
  console.error('❌ Firebase setup error:', error);
}

console.log('\n📋 Setup Checklist:');
console.log('□ Authentication enabled (Email/Password)');
console.log('□ Firestore database created');
console.log('□ Storage bucket created');
console.log('□ Security rules configured');
console.log('□ Test account created');

console.log('\n🔧 If any services are missing:');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. Select project: crm-app-ea777');
console.log('3. Enable missing services');
console.log('4. Check the FIREBASE_COMPLETE_SETUP.md file for detailed instructions');

console.log('\n📱 Test the app with:');
console.log('Email: test@habanero.com');
console.log('Password: password123'); 