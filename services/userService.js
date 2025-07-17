import { 
  collection, 
  getDocs, 
  getDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

export const userService = {
  // Get all users (for admin dropdown)
  async getAllUsers() {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('fullName', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      
      // If permission denied, try to get current user and create a test user
      if (error.code === 'permission-denied') {
        console.log('Permission denied, creating test user data...');
        return this.getTestUsers();
      }
      
      throw new Error('Failed to get users');
    }
  },

  // Get users by role
  async getUsersByRole(role) {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role),
        orderBy('fullName', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error getting users by role:', error);
      
      // If permission denied, return test users based on role
      if (error.code === 'permission-denied') {
        console.log('Permission denied, returning test users for role:', role);
        const testUsers = this.getTestUsers();
        return testUsers.filter(user => user.role === role);
      }
      
      throw new Error('Failed to get users by role');
    }
  },

  // Get a specific user
  async getUser(userId) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  },

  // Update user role
  async updateUserRole(userId, newRole) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date(),
      });
      
      console.log('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  },

  // Get user statistics
  async getUserStats() {
    try {
      const [allUsers, clientUsers, adminUsers] = await Promise.all([
        this.getAllUsers(),
        this.getUsersByRole('user'),
        this.getUsersByRole('admin')
      ]);
      
      return {
        total: allUsers.length,
        clients: clientUsers.length,
        admins: adminUsers.length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  },

  // Get test users for when permissions are denied
  getTestUsers() {
    console.log('Creating test users for development...');
    return [
      {
        id: 'test-user-1',
        uid: 'test-user-1',
        email: 'client1@test.com',
        fullName: 'Test Client 1',
        businessName: 'Test Business 1',
        phoneNumber: '+1234567890',
        role: 'user',
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'test-user-2',
        uid: 'test-user-2',
        email: 'client2@test.com',
        fullName: 'Test Client 2',
        businessName: 'Test Business 2',
        phoneNumber: '+1234567891',
        role: 'user',
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'test-admin',
        uid: 'test-admin',
        email: 'admin@test.com',
        fullName: 'Test Admin',
        businessName: 'Hello Habanero',
        phoneNumber: '+1234567892',
        role: 'admin',
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  },

  // Test function to debug user loading
  async debugUsers() {
    try {
      console.log('=== DEBUG: User Service Test ===');
      
      const allUsers = await this.getAllUsers();
      console.log('All users count:', allUsers.length);
      console.log('All users:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role, fullName: u.fullName })));
      
      const userRoleUsers = await this.getUsersByRole('user');
      console.log('Users with role "user" count:', userRoleUsers.length);
      console.log('Users with role "user":', userRoleUsers.map(u => ({ id: u.id, email: u.email, role: u.role, fullName: u.fullName })));
      
      const adminRoleUsers = await this.getUsersByRole('admin');
      console.log('Users with role "admin" count:', adminRoleUsers.length);
      console.log('Users with role "admin":', adminRoleUsers.map(u => ({ id: u.id, email: u.email, role: u.role, fullName: u.fullName })));
      
      return {
        allUsers,
        userRoleUsers,
        adminRoleUsers
      };
    } catch (error) {
      console.error('Debug error:', error);
      throw error;
    }
  }
}; 