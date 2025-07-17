import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// Migration script to update existing documents to use new field names
export const migrateData = async () => {
  console.log('Starting data migration...');
  
  try {
    // Migrate projects
    console.log('Migrating projects...');
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    let projectsUpdated = 0;
    
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      const updates = {};
      
      // Update userId to assigned_user_id
      if (projectData.userId && !projectData.assigned_user_id) {
        updates.assigned_user_id = projectData.userId;
        delete updates.userId;
      }
      
      // Add website_link if missing
      if (!projectData.website_link) {
        updates.website_link = null;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'projects', projectDoc.id), updates);
        projectsUpdated++;
        console.log(`Updated project: ${projectDoc.id}`);
      }
    }
    
    console.log(`Projects updated: ${projectsUpdated}`);
    
    // Migrate tasks
    console.log('Migrating tasks...');
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    let tasksUpdated = 0;
    
    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();
      const updates = {};
      
      // Update userId to assigned_user_id
      if (taskData.userId && !taskData.assigned_user_id) {
        updates.assigned_user_id = taskData.userId;
        delete updates.userId;
      }
      
      // Update projectId to project_id
      if (taskData.projectId && !taskData.project_id) {
        updates.project_id = taskData.projectId;
        delete updates.projectId;
      }
      
      // Update taskType to type
      if (taskData.taskType && !taskData.type) {
        let newType = 'Need Feedback';
        if (taskData.taskType === 'media-upload') {
          newType = 'Need Media';
        } else if (taskData.taskType === 'notes') {
          newType = 'Need Feedback';
        }
        updates.type = newType;
        delete updates.taskType;
      }
      
      // Update status if needed
      if (taskData.status === 'unresolved') {
        updates.status = 'pending';
      }
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'tasks', taskDoc.id), updates);
        tasksUpdated++;
        console.log(`Updated task: ${taskDoc.id}`);
      }
    }
    
    console.log(`Tasks updated: ${tasksUpdated}`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (typeof window === 'undefined') {
  migrateData().then(() => {
    console.log('Migration script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
} 