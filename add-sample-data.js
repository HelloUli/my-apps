const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq",
  authDomain: "hellohabanero-crm.firebaseapp.com",
  projectId: "hellohabanero-crm",
  storageBucket: "hellohabanero-crm.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Replace this with your actual user ID from the app
const USER_ID = "YOUR_USER_ID_HERE"; // You'll need to replace this with your actual user ID

async function addSampleData() {
  try {
    console.log('🚀 Adding sample data to Firebase...');

    // Add sample project
    const projectData = {
      userId: USER_ID,
      title: "Macho Bros Website",
      description: "Complete website redesign for Macho Bros fitness brand. Modern, responsive design with e-commerce integration.",
      status: "in-progress",
      priority: "high",
      startDate: new Date('2024-01-15'),
      dueDate: new Date('2024-03-15'),
      budget: 7500,
      progress: 35,
      clientName: "Macho Bros Fitness",
      projectType: "website",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const projectRef = await addDoc(collection(db, 'projects'), projectData);
    console.log('✅ Project added with ID:', projectRef.id);

    // Add sample task
    const taskData = {
      userId: USER_ID,
      title: "Need Media for Website",
      description: "Please upload high-quality images and videos for the Macho Bros website. We need product photos, team photos, and promotional content.",
      instructions: "Upload images in JPG/PNG format (minimum 1920x1080px). Videos should be MP4 format (max 100MB). Include: logo files, product images, team photos, workout videos, and any brand assets.",
      taskType: "media-upload",
      priority: "high",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignedBy: "admin",
      status: "unresolved",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const taskRef = await addDoc(collection(db, 'tasks'), taskData);
    console.log('✅ Task added with ID:', taskRef.id);

    console.log('🎉 Sample data added successfully!');
    console.log('📝 Project ID:', projectRef.id);
    console.log('📝 Task ID:', taskRef.id);
    console.log('👤 User ID:', USER_ID);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Instructions for the user
console.log('📋 INSTRUCTIONS:');
console.log('1. Replace USER_ID with your actual user ID from the app');
console.log('2. Run this script with: node add-sample-data.js');
console.log('3. Your user ID can be found in the app console or Firebase Auth');
console.log('');

// Uncomment the line below after setting your user ID
// addSampleData(); 