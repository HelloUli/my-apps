const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

// Your Firebase config - copy from firebase-config.json
const firebaseConfig = {
  // Add your Firebase config here
  // You can copy this from your firebase-config.json file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testTaskResponses() {
  try {
    console.log('Testing task_responses collection...');
    
    // Test 1: Create a sample task response
    const sampleResponse = {
      task_id: 'test-task-123',
      user_id: 'test-user-456',
      notes: 'This is a test response with notes',
      media_files: [
        {
          fileName: 'test-image.jpg',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          url: 'https://example.com/test-image.jpg',
          uploadedAt: new Date()
        }
      ],
      submitted_at: new Date(),
      status: 'submitted'
    };
    
    console.log('Creating sample task response...');
    const docRef = await addDoc(collection(db, 'task_responses'), sampleResponse);
    console.log('✅ Sample task response created with ID:', docRef.id);
    
    // Test 2: Verify collection exists by reading all documents
    console.log('Reading all task responses...');
    const querySnapshot = await getDocs(collection(db, 'task_responses'));
    console.log('✅ Found', querySnapshot.size, 'task response(s)');
    
    querySnapshot.forEach((doc) => {
      console.log('Document ID:', doc.id);
      console.log('Document data:', doc.data());
    });
    
    console.log('\n🎉 task_responses collection is working correctly!');
    console.log('You can now create the Firebase indexes as described in create-task-responses-indexes.md');
    
  } catch (error) {
    console.error('❌ Error testing task_responses:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testTaskResponses(); 