const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
  // You can copy this from your firebase-config.json file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateUserRoles() {
  try {
    console.log('Starting user role updates...');
    
    // Define the email to role mapping
    const roleMapping = {
      'ulyssesg1965@gmail.com': 'admin',
      'ulises@hellohabanero.com': 'user'
    };
    
    // For each email, we need to find the user document and update it
    // Since we don't have a direct email query, you'll need to manually update these
    // or provide the user UIDs
    
    console.log('Please manually update the following users in your Firestore:');
    console.log('1. Find user with email: ulyssesg1965@gmail.com');
    console.log('   - Set role to: admin');
    console.log('2. Find user with email: ulises@hellohabanero.com');
    console.log('   - Set role to: user');
    
    console.log('\nOr if you know the user UIDs, you can update them programmatically.');
    
  } catch (error) {
    console.error('Error updating user roles:', error);
  }
}

// If you know the user UIDs, you can uncomment and modify this function
async function updateSpecificUserRole(uid, newRole) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date(),
    });
    console.log(`User ${uid} role updated to: ${newRole}`);
  } catch (error) {
    console.error(`Error updating user ${uid}:`, error);
  }
}

// Example usage (uncomment and modify with actual UIDs):
// updateSpecificUserRole('user-uid-here', 'admin');
// updateSpecificUserRole('user-uid-here', 'user');

updateUserRoles(); 