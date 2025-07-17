import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

export const authService = {
  // Sign up new user
  async signUp(userData) {
    try {
      const { email, password, fullName, businessName, phoneNumber } = userData;
      console.log('Attempting to sign up user:', email);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Firebase auth user created, ID:', user.uid);
      
      // Update display name
      await updateProfile(user, {
        displayName: fullName,
      });
      console.log('Display name updated');
      
      // Determine role based on email
      let role = 'user';
      if (email === 'ulyssesg1965@gmail.com') {
        role = 'admin';
      } else if (email === 'ulises@hellohabanero.com') {
        role = 'user';
      }
      
      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: email,
        fullName: fullName,
        businessName: businessName,
        phoneNumber: phoneNumber,
        role: role,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log('User document created in Firestore with role:', role);
      
      return { user, userData: userDoc };
    } catch (error) {
      console.error('Sign up error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      console.log('Attempting to sign in with:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Firebase auth successful, user ID:', user.uid);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('User document not found in Firestore - creating basic profile');
        
        // Determine role based on email
        let role = 'user';
        if (email === 'ulyssesg1965@gmail.com') {
          role = 'admin';
        } else if (email === 'ulises@hellohabanero.com') {
          role = 'user';
        }
        
        // Create a basic user document if it doesn't exist
        const basicUserDoc = {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || 'User',
          businessName: 'Hello Habanero',
          phoneNumber: '',
          role: role,
          profilePicture: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(doc(db, 'users', user.uid), basicUserDoc);
        console.log('Basic user document created with role:', role);
        return { user, userData: basicUserDoc };
      }
      
      // Check if user role needs to be updated based on email
      const userData = userDoc.data();
      let updatedRole = userData.role;
      
      if (email === 'ulyssesg1965@gmail.com' && userData.role !== 'admin') {
        updatedRole = 'admin';
        await updateDoc(doc(db, 'users', user.uid), { role: 'admin', updatedAt: new Date() });
        console.log('User role updated to admin');
      } else if (email === 'ulises@hellohabanero.com' && userData.role !== 'user') {
        updatedRole = 'user';
        await updateDoc(doc(db, 'users', user.uid), { role: 'user', updatedAt: new Date() });
        console.log('User role updated to user');
      }
      
      console.log('User data retrieved successfully');
      return { user, userData: { ...userData, role: updatedRole } };
    } catch (error) {
      console.error('Sign in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Send password reset email
  async forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Error signing out');
    }
  },

  // Update user profile
  async updateProfile(uid, updates) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });
      
      // Get updated user data
      const userDoc = await getDoc(userRef);
      return userDoc.data();
    } catch (error) {
      throw new Error('Error updating profile');
    }
  },

  // Upload profile picture
  async uploadProfilePicture(uid, imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `profile-pictures/${uid}`);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user profile with new picture URL
      await this.updateProfile(uid, { profilePicture: downloadURL });
      
      return downloadURL;
    } catch (error) {
      throw new Error('Error uploading profile picture');
    }
  },

  // Get user data
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      return userDoc.data();
    } catch (error) {
      throw new Error('Error fetching user data');
    }
  },



  // Get error messages
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again or create a new account.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return `An error occurred: ${errorCode}. Please try again.`;
    }
  },
}; 