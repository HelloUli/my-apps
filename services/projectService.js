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

export const projectService = {
  // Create a new project
  async createProject(projectData) {
    try {
      const project = {
        ...projectData,
        assigned_user_id: projectData.assigned_user_id, // ensure this is set
        website_link: projectData.website_link || null, // nullable
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      delete project.userId; // remove old field if present
      const docRef = await addDoc(collection(db, 'projects'), project);
      console.log('Project created with ID:', docRef.id);
      return { id: docRef.id, ...project };
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  },

  // Get all projects for a specific user
  async getUserProjects(userId) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('assigned_user_id', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return projects;
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  },

  // Get ongoing projects for a user
  async getOngoingProjects(userId) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('assigned_user_id', '==', userId),
        where('status', '==', 'in-progress'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return projects;
    } catch (error) {
      console.error('Error getting ongoing projects:', error);
      // If it's an index error, try a simpler query
      console.log('Index not ready, trying simpler query...');
      return this.getUserProjects(userId).then(projects => 
        projects.filter(project => project.status === 'in-progress')
      );
    }
  },

  // Get all projects (admin view)
  async getAllProjects() {
    try {
      const q = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects = [];
      
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return projects;
    } catch (error) {
      console.error('Error getting all projects:', error);
      return [];
    }
  },

  // Get a specific project
  async getProject(projectId) {
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Project not found');
      }
    } catch (error) {
      console.error('Error getting project:', error);
      throw new Error('Failed to get project');
    }
  },

  // Update a project
  async updateProject(projectId, updates) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: new Date(),
      });
      
      console.log('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  },

  // Delete a project
  async deleteProject(projectId) {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      console.log('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  },

  // Create sample projects for testing
  async createSampleProjects(userId) {
    try {
      const sampleProjects = [
        {
          assigned_user_id: userId,
          title: 'Website Redesign',
          description: 'Complete redesign of company website with modern UI/UX',
          status: 'in-progress',
          priority: 'high',
          startDate: new Date('2024-01-15'),
          dueDate: new Date('2024-03-15'),
          budget: 5000,
          progress: 65,
          clientName: 'Acme Corp',
          projectType: 'website'
        },
        {
          assigned_user_id: userId,
          title: 'Mobile Photo Shoot',
          description: 'Professional product photography for mobile app marketing',
          status: 'in-progress',
          priority: 'medium',
          startDate: new Date('2024-02-01'),
          dueDate: new Date('2024-02-28'),
          budget: 2500,
          progress: 40,
          clientName: 'TechStart Inc',
          projectType: 'photography'
        }
      ];

      for (const project of sampleProjects) {
        await this.createProject(project);
      }

      console.log('Sample projects created successfully');
    } catch (error) {
      console.error('Error creating sample projects:', error);
      throw new Error('Failed to create sample projects');
    }
  }
}; 