const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Your Firebase config - copy from firebase-config.json
const firebaseConfig = {
  // Add your Firebase config here
  // You can copy this from your firebase-config.json file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugTasks() {
  try {
    console.log('🔍 Debugging tasks...');
    
    // Get all tasks
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    console.log('📊 Total tasks in database:', tasksSnapshot.size);
    
    const tasks = [];
    tasksSnapshot.forEach((doc) => {
      const task = { id: doc.id, ...doc.data() };
      tasks.push(task);
      console.log(`Task: ${task.title} | Status: ${task.status} | Assigned to: ${task.assigned_user_id}`);
    });
    
    // Check for pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    console.log('\n⏳ Pending tasks:', pendingTasks.length);
    pendingTasks.forEach(task => {
      console.log(`- ${task.title} (ID: ${task.id}) assigned to ${task.assigned_user_id}`);
    });
    
    // Check for tasks assigned to specific users
    const testUsers = ['ulyssesg1965@gmail.com', 'ulises@hellohabanero.com'];
    console.log('\n👥 Checking tasks by user:');
    
    for (const email of testUsers) {
      const userTasks = tasks.filter(t => t.assigned_user_id === email);
      console.log(`${email}: ${userTasks.length} tasks`);
      userTasks.forEach(task => {
        console.log(`  - ${task.title} (Status: ${task.status})`);
      });
    }
    
    // Check task_responses collection
    console.log('\n📝 Checking task_responses collection...');
    try {
      const responsesSnapshot = await getDocs(collection(db, 'task_responses'));
      console.log('Task responses found:', responsesSnapshot.size);
    } catch (error) {
      console.log('❌ task_responses collection error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error debugging tasks:', error);
  }
}

// Run the debug
debugTasks(); 