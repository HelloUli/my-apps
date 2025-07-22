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
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import * as FileSystem from 'expo-file-system';

export const taskResponseService = {
  // Submit a task response with media and notes
  async submitTaskResponse(taskId, userId, responseData) {
    try {
      const { notes, mediaFiles } = responseData;
      
      // Upload media files to Firebase Storage
      const uploadedMedia = [];
      if (mediaFiles && mediaFiles.length > 0) {
        for (const mediaFile of mediaFiles) {
          try {
            const mediaUrl = await this.uploadMediaFile(taskId, userId, mediaFile);
            uploadedMedia.push({
              fileName: mediaFile.fileName,
              fileSize: mediaFile.fileSize,
              mimeType: mediaFile.mimeType,
              url: mediaUrl,
              uploadedAt: new Date()
            });
            console.log('Uploaded media file:', mediaFile.fileName, 'URL:', mediaUrl);
          } catch (uploadError) {
            console.error('Error uploading media file:', mediaFile.fileName, uploadError);
            // Provide more specific error messages
            let errorMessage = 'Failed to upload media file: ' + mediaFile.fileName;
            if (uploadError.message.includes('storage/unauthorized')) {
              errorMessage += ' - Unauthorized access to storage';
            } else if (uploadError.message.includes('storage/quota-exceeded')) {
              errorMessage += ' - Storage quota exceeded';
            } else if (uploadError.message.includes('storage/unknown')) {
              errorMessage += ' - Network or server error. Please try again.';
            } else {
              errorMessage += ' - ' + uploadError.message;
            }
            throw new Error(errorMessage);
          }
        }
      }
      
      // Create response document
      const response = {
        task_id: taskId,
        user_id: userId,
        notes: notes || '',
        media_files: uploadedMedia,
        submitted_at: new Date(),
        status: 'submitted'
      };
      
      try {
        const docRef = await addDoc(collection(db, 'task_responses'), response);
        console.log('Task response submitted with ID:', docRef.id);
        return { id: docRef.id, ...response };
      } catch (firestoreError) {
        console.error('Error writing task response to Firestore:', firestoreError);
        throw new Error('Failed to write task response to Firestore: ' + firestoreError.message);
      }
    } catch (error) {
      console.error('Error submitting task response:', error);
      throw error;
    }
  },

  // Upload a single media file
  async uploadMediaFile(taskId, userId, mediaFile) {
    try {
      const fileName = `${taskId}_${userId}_${Date.now()}_${mediaFile.fileName}`;
      const storageRef = ref(storage, `task-reviews/${fileName}`);
      
      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(mediaFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Upload base64 string to Firebase
      await uploadString(storageRef, base64Data, 'base64');
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading media file:', error);
      throw new Error('Failed to upload media file: ' + error.message);
    }
  },

  // Get all task responses (for admin)
  async getAllTaskResponses() {
    try {
      const q = query(
        collection(db, 'task_responses'),
        orderBy('submitted_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const responses = [];
      querySnapshot.forEach((doc) => {
        responses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return responses;
    } catch (error) {
      console.error('Error getting task responses:', error);
      return [];
    }
  },

  // Get task responses for a specific task
  async getTaskResponses(taskId) {
    try {
      const q = query(
        collection(db, 'task_responses'),
        where('task_id', '==', taskId),
        orderBy('submitted_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const responses = [];
      querySnapshot.forEach((doc) => {
        responses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return responses;
    } catch (error) {
      console.error('Error getting task responses:', error);
      return [];
    }
  },

  // Get task responses for a specific user
  async getUserTaskResponses(userId) {
    try {
      const q = query(
        collection(db, 'task_responses'),
        where('user_id', '==', userId),
        orderBy('submitted_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const responses = [];
      querySnapshot.forEach((doc) => {
        responses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return responses;
    } catch (error) {
      console.error('Error getting user task responses:', error);
      return [];
    }
  },

  // Get a specific task response
  async getTaskResponse(responseId) {
    try {
      const docRef = doc(db, 'task_responses', responseId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Task response not found');
      }
    } catch (error) {
      console.error('Error getting task response:', error);
      throw new Error('Failed to get task response');
    }
  },

  // Update a task response
  async updateTaskResponse(responseId, updates) {
    try {
      const responseRef = doc(db, 'task_responses', responseId);
      await updateDoc(responseRef, {
        ...updates,
        updated_at: new Date(),
      });
      
      console.log('Task response updated successfully');
    } catch (error) {
      console.error('Error updating task response:', error);
      throw new Error('Failed to update task response');
    }
  },

  // Delete a task response
  async deleteTaskResponse(responseId) {
    try {
      await deleteDoc(doc(db, 'task_responses', responseId));
      console.log('Task response deleted successfully');
    } catch (error) {
      console.error('Error deleting task response:', error);
      throw new Error('Failed to delete task response');
    }
  },

  // Mark task response as reviewed (admin)
  async markResponseAsReviewed(responseId, adminNotes = '') {
    try {
      const responseRef = doc(db, 'task_responses', responseId);
      await updateDoc(responseRef, {
        status: 'reviewed',
        reviewed_at: new Date(),
        admin_notes: adminNotes,
        updated_at: new Date(),
      });
      
      console.log('Task response marked as reviewed');
    } catch (error) {
      console.error('Error marking response as reviewed:', error);
      throw new Error('Failed to mark response as reviewed');
    }
  }
}; 