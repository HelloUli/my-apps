const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Your Firebase config - copy from firebase-config.json
const firebaseConfig = {
  // Add your Firebase config here
  // You can copy this from your firebase-config.json file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTaskResponsesCollection() {
  try {
    console.log('Creating task_responses collection...');
    
    // Create a test document to initialize the collection
    const testResponse = {
      task_id: 'test-task-001',
      user_id: 'test-user-001',
      notes: 'This is a test task response to create the collection',
      media_files: [],
      submitted_at: new Date(),
      status: 'submitted'
    };
    
    const docRef = await addDoc(collection(db, 'task_responses'), testResponse);
    console.log('✅ task_responses collection created successfully!');
    console.log('✅ Test document created with ID:', docRef.id);
    console.log('\nYou can now:');
    console.log('1. Check your Firebase Console to see the new collection');
    console.log('2. Create the indexes as described in create-task-responses-indexes.md');
    console.log('3. Test the functionality in your app');
    
  } catch (error) {
    console.error('❌ Error creating task_responses collection:', error);
    console.error('Error details:', error.message);
  }
}

// Run the script
createTaskResponsesCollection(); 