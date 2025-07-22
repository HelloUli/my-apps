import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import * as FileSystem from 'expo-file-system';

export const taskReviewService = {
  // Create a new review task
  async createReviewTask(taskData) {
    try {
      const reviewTaskData = {
        ...taskData,
        type: 'Review Task',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'tasks'), reviewTaskData);
      console.log('Review task created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...reviewTaskData
      };
    } catch (error) {
      console.error('Error creating review task:', error);
      throw new Error('Failed to create review task');
    }
  },

  // Upload media for review task
  async uploadReviewMedia(fileUri, fileName, taskId) {
    try {
      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create storage reference
      const storageRef = ref(storage, `task-reviews/${taskId}/${fileName}`);
      
      // Upload base64 string
      await uploadString(storageRef, base64Data, 'base64');
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading review media:', error);
      throw new Error('Failed to upload review media');
    }
  },

  // Get review tasks for a user
  async getReviewTasksForUser(userId) {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('assigned_user_id', '==', userId),
        where('type', '==', 'Review Task'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reviewTasks = [];
      
      querySnapshot.forEach((doc) => {
        reviewTasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return reviewTasks;
    } catch (error) {
      console.error('Error getting review tasks for user:', error);
      throw new Error('Failed to get review tasks');
    }
  },

  // Approve a review task
  async approveReviewTask(taskId, userId) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      
      await updateDoc(taskRef, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log('Review task approved:', taskId);
      return true;
    } catch (error) {
      console.error('Error approving review task:', error);
      throw new Error('Failed to approve review task');
    }
  },

  // Get review task by ID
  async getReviewTask(taskId) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (taskSnap.exists()) {
        return {
          id: taskSnap.id,
          ...taskSnap.data()
        };
      } else {
        throw new Error('Review task not found');
      }
    } catch (error) {
      console.error('Error getting review task:', error);
      throw new Error('Failed to get review task');
    }
  },

  // Get all review tasks (for admin)
  async getAllReviewTasks() {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('type', '==', 'Review Task'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reviewTasks = [];
      
      querySnapshot.forEach((doc) => {
        reviewTasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return reviewTasks;
    } catch (error) {
      console.error('Error getting all review tasks:', error);
      throw new Error('Failed to get review tasks');
    }
  },

  // Update review task
  async updateReviewTask(taskId, updateData) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      
      await updateDoc(taskRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      
      console.log('Review task updated:', taskId);
      return true;
    } catch (error) {
      console.error('Error updating review task:', error);
      throw new Error('Failed to update review task');
    }
  },
}; 