import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const taskService = {
  // Create a new task
  async createTask(taskData) {
    try {
      const task = {
        ...taskData,
        project_id: taskData.project_id, // ensure this is set
        type: taskData.type, // 'Need Feedback' or 'Need Media'
        status: 'pending', // Default status
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Remove old fields if present
      delete task.taskType;
      delete task.userId;
      const docRef = await addDoc(collection(db, 'tasks'), task);
      console.log('Task created with ID:', docRef.id);
      return { id: docRef.id, ...task };
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  },

  // Get unresolved tasks for a specific user (now pending)
  async getPendingTasks(userId) {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('assigned_user_id', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return tasks;
    } catch (error) {
      console.error('Error getting pending tasks:', error);
      return [];
    }
  },

  // Get all tasks for admin view
  async getAllTasks() {
    try {
      const q = query(
        collection(db, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return tasks;
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return [];
    }
  },

  // Get all tasks for a specific user
  async getUserTasks(userId) {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('assigned_user_id', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks = [];
      
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return tasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      
      // If it's an index error, try without orderBy
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        console.log('Index not ready, trying query without orderBy...');
        try {
          const simpleQuery = query(
            collection(db, 'tasks'),
            where('assigned_user_id', '==', userId)
          );
          
          const querySnapshot = await getDocs(simpleQuery);
          const tasks = [];
          
          querySnapshot.forEach((doc) => {
            tasks.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // Sort manually
          return tasks.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return []; // Return empty array instead of throwing
        }
      }
      
      throw new Error('Failed to get user tasks');
    }
  },

  // Get all tasks for a specific project
  async getProjectTasks(projectId) {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('project_id', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return tasks;
    } catch (error) {
      console.error('Error getting project tasks:', error);
      return [];
    }
  },

  // Mark task as resolved (client side)
  async resolveTask(taskId, resolutionData) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: resolutionData.userId,
        resolutionNotes: resolutionData.notes || '',
        clientResponse: resolutionData.response || '',
        uploadedMedia: resolutionData.uploadedMedia || [],
        adminNotification: true, // notify admin
        updatedAt: new Date(),
      });
      console.log('Task resolved by client');
    } catch (error) {
      console.error('Error resolving task:', error);
      throw new Error('Failed to resolve task');
    }
  },

  // Mark task as completed (admin side)
  async completeTask(taskId, completionData) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'completed',
        completedAt: new Date(),
        completedBy: completionData.adminId,
        adminNotes: completionData.notes || '',
        updatedAt: new Date(),
      });
      
      console.log('Task completed by admin');
    } catch (error) {
      console.error('Error completing task:', error);
      throw new Error('Failed to complete task');
    }
  },

  // Get a specific task
  async getTask(taskId) {
    try {
      const docRef = doc(db, 'tasks', taskId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Task not found');
      }
    } catch (error) {
      console.error('Error getting task:', error);
      throw new Error('Failed to get task');
    }
  },

  // Update a task
  async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date(),
      });
      
      console.log('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  },

  // Delete a task
  async deleteTask(taskId) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  },

  // Create sample tasks for testing
  async createSampleTasks(userId) {
    try {
      const sampleTasks = [
        {
          assigned_user_id: userId,
          title: 'Upload Project Photos',
          description: 'Please upload a batch of photos for your website project. Include: logo files, product images, team photos, and any brand assets.',
          instructions: 'Upload high-resolution images (minimum 1920x1080px) in JPG or PNG format. Include your company logo in vector format if available.',
          type: 'Need Media',
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          assignedBy: 'admin'
        },
        {
          assigned_user_id: userId,
          title: 'Provide Project Notes',
          description: 'Please provide detailed notes about your website requirements, including design preferences, target audience, and specific features needed.',
          instructions: 'Include information about your brand colors, preferred style (modern, classic, minimalist), target audience demographics, and any specific functionality requirements.',
          type: 'Need Feedback',
          priority: 'medium',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          assignedBy: 'admin'
        },
        {
          assigned_user_id: userId,
          title: 'Video Content Upload',
          description: 'Upload any video content you would like to include in your mobile app marketing materials.',
          instructions: 'Upload videos in MP4 format, maximum 100MB per file. Include product demos, testimonials, or promotional content.',
          type: 'Need Media',
          priority: 'medium',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          assignedBy: 'admin'
        }
      ];

      for (const task of sampleTasks) {
        await this.createTask(task);
      }

      console.log('Sample tasks created successfully');
    } catch (error) {
      console.error('Error creating sample tasks:', error);
      throw new Error('Failed to create sample tasks');
    }
  },

  // Get task statistics
  async getTaskStats(userId) {
    try {
      const unresolvedQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        where('status', '==', 'unresolved')
      );
      
      const resolvedQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        where('status', '==', 'resolved')
      );
      
      const [unresolvedSnapshot, resolvedSnapshot] = await Promise.all([
        getDocs(unresolvedQuery),
        getDocs(resolvedQuery)
      ]);
      
      return {
        unresolved: unresolvedSnapshot.size,
        resolved: resolvedSnapshot.size,
        total: unresolvedSnapshot.size + resolvedSnapshot.size
      };
    } catch (error) {
      console.error('Error getting task stats:', error);
      throw new Error('Failed to get task statistics');
    }
  },

  // Upload media for a task
  async uploadTaskMedia(taskId, file, fileName) {
    try {
      // Create a storage reference
      const storageRef = ref(storage, `task-media/${taskId}/${fileName}`);
      // Upload the file
      await uploadBytes(storageRef, file);
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      // Update the task with the new media URL
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      let uploadedMedia = [];
      if (taskSnap.exists() && Array.isArray(taskSnap.data().uploadedMedia)) {
        uploadedMedia = taskSnap.data().uploadedMedia;
      }
      uploadedMedia.push(downloadURL);
      await updateDoc(taskRef, {
        uploadedMedia,
        adminNotification: true, // notify admin
        updatedAt: new Date(),
      });
      return downloadURL;
    } catch (error) {
      console.error('Error uploading task media:', error);
      throw new Error('Failed to upload media');
    }
  }
}; 