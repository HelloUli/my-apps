import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const AssignProjectsScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    clientName: '',
    budget: '',
    dueDate: '',
    projectType: 'website'
  });

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users for assignment...');
      
      let clientUsers = [];
      
      try {
        // First try to get all users and filter
        const allUsers = await userService.getAllUsers();
        // Hardcode roles for test emails
        allUsers.forEach(user => {
          if (user.email === 'ulyssesg1965@gmail.com') user.role = 'admin';
          if (user.email === 'ulises@hellohabanero.com') user.role = 'user';
        });
        // Ensure 'uli' is included if present
        const uliUser = allUsers.find(u => u.fullName?.toLowerCase() === 'uli');
        if (uliUser && !allUsers.includes(uliUser)) allUsers.push(uliUser);
        // Filter to only show users (not admins) and exclude the current admin
        const currentUser = auth.currentUser;
        clientUsers = allUsers.filter(user => 
          user.role === 'user' && user.id !== currentUser?.uid
        );
      } catch (error) {
        console.log('Fallback: Loading users by role directly...');
        // Fallback: load users by role directly
        clientUsers = await userService.getUsersByRole('user');
        const currentUser = auth.currentUser;
        clientUsers = clientUsers.filter(user => user.id !== currentUser?.uid);
      }
      
      console.log('Client users filtered:', clientUsers.length);
      console.log('Client user details:', clientUsers.map(u => ({ id: u.id, email: u.email, fullName: u.fullName })));
      
      setUsers(clientUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const debugUsers = async () => {
    try {
      console.log('=== Running debug test ===');
      await userService.debugUsers();
      Alert.alert('Debug Complete', 'Check console for detailed user information');
    } catch (error) {
      console.error('Debug failed:', error);
      Alert.alert('Debug Failed', error.message);
    }
  };

  const createTestUser = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Create a test user document in Firestore
        const testUserData = {
          uid: 'test-user-' + Date.now(),
          email: 'testclient@example.com',
          fullName: 'Test Client',
          businessName: 'Test Business',
          phoneNumber: '+1234567890',
          role: 'user',
          profilePicture: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Try to create the user document
        const userRef = doc(db, 'users', testUserData.uid);
        await setDoc(userRef, testUserData);
        
        Alert.alert('Success', 'Test user created! Refresh to see in dropdown.');
        loadUsers(); // Reload the users list
      }
    } catch (error) {
      console.error('Error creating test user:', error);
      Alert.alert('Error', 'Failed to create test user: ' + error.message);
    }
  };

  const openUserModal = () => {
    setShowUserModal(true);
  };

  const selectUser = (user) => {
    console.log('Selected user:', user);
    setSelectedUser(user);
    setShowUserModal(false);
    setShowModal(true);
    console.log('Modal should be visible now, showModal:', true);
  };

  const addTask = () => {
    const newTask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'Need Media', // Default to 'Need Media'
      priority: 'medium',
      instructions: ''
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const createProjectAndTasks = async () => {
    if (!selectedUser || !projectData.title || !projectData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (tasks.length === 0) {
      Alert.alert('Error', 'Please add at least one task');
      return;
    }

    try {
      setCreatingProject(true);
      const currentUser = auth.currentUser;

      // Create project
      const project = {
        assigned_user_id: selectedUser.id,
        title: projectData.title,
        description: projectData.description,
        clientName: projectData.clientName || selectedUser.businessName || selectedUser.fullName,
        budget: parseFloat(projectData.budget) || 0,
        dueDate: projectData.dueDate ? new Date(projectData.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        projectType: projectData.projectType,
        status: 'in-progress',
        priority: 'medium',
        progress: 0,
        assignedBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const projectRef = await projectService.createProject(project);
      // Create tasks
      for (const task of tasks) {
        if (task.title && task.description) {
          const taskData = {
            assigned_user_id: selectedUser.id,
            project_id: projectRef.id,
            title: task.title,
            description: task.description,
            instructions: task.instructions,
            type: task.type, // Should be 'Need Feedback' or 'Need Media'
            priority: task.priority,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            assignedBy: currentUser.uid,
            status: 'pending',
            createdAt: new Date(),
          };
          await taskService.createTask(taskData);
        }
      }

      // Reset form
      setProjectData({
        title: '',
        description: '',
        clientName: '',
        budget: '',
        dueDate: '',
        projectType: 'website'
      });
      setTasks([]);
      setSelectedUser(null);
      setShowModal(false);

      Alert.alert('Success', 'Project and tasks assigned successfully!');
      navigation.goBack();

    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case 'media-upload': return 'cloud-upload';
      case 'feedback': return 'chatbubble-ellipses';
      case 'notes': return 'document-text';
      default: return 'checkmark-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Assign Projects</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadUsers}
          >
            <Ionicons name="refresh" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Client</Text>
              <TouchableOpacity
                style={styles.selectUserButton}
                onPress={openUserModal}
              >
                {selectedUser ? (
                  <View style={styles.selectedUser}>
                    <Text style={styles.selectedUserName}>{selectedUser.fullName}</Text>
                    <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                  </View>
                ) : (
                  <Text style={styles.selectUserText}>Tap to select a client</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Project Details</Text>
                <TouchableOpacity
                  style={styles.createProjectButton}
                  onPress={() => setShowModal(true)}
                >
                  <Ionicons name="add-circle" size={24} color={COLORS.white} />
                  <Text style={styles.createProjectText}>Create New Project</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Clients</Text>
              {users.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people" size={48} color={COLORS.darkGray} />
                  <Text style={styles.emptyText}>No clients available</Text>
                  <Text style={styles.debugText}>Debug: Check console for user loading details</Text>
                  <TouchableOpacity
                    style={styles.debugButton}
                    onPress={loadUsers}
                  >
                    <Text style={styles.debugButtonText}>Reload Users</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.debugButton, { backgroundColor: COLORS.secondary, marginTop: 5 }]}
                    onPress={debugUsers}
                  >
                    <Text style={styles.debugButtonText}>Debug Users</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.debugButton, { backgroundColor: COLORS.accent, marginTop: 5 }]}
                    onPress={createTestUser}
                  >
                    <Text style={styles.debugButtonText}>Create Test User</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userCard}
                    onPress={() => selectUser(user)}
                  >
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.fullName}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userBusiness}>{user.businessName || 'No business name'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        </View>

        {/* User Selection Modal */}
        <Modal
          visible={showUserModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <ScrollView style={styles.userList}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.modalUserItem}
                    onPress={() => selectUser(user)}
                  >
                    <Text style={styles.modalUserName}>{user.fullName}</Text>
                    <Text style={styles.modalUserEmail}>{user.email}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowUserModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Project Creation Modal */}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Project for {selectedUser?.fullName}</Text>
              
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalLabel}>Project Title *:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter project title..."
                  value={projectData.title}
                  onChangeText={(text) => setProjectData({...projectData, title: text})}
                />
                
                <Text style={styles.modalLabel}>Description *:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter project description..."
                  value={projectData.description}
                  onChangeText={(text) => setProjectData({...projectData, description: text})}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                
                <Text style={styles.modalLabel}>Client Name:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter client name..."
                  value={projectData.clientName}
                  onChangeText={(text) => setProjectData({...projectData, clientName: text})}
                />
                
                <Text style={styles.modalLabel}>Budget ($):</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter budget amount..."
                  value={projectData.budget}
                  onChangeText={(text) => setProjectData({...projectData, budget: text})}
                  keyboardType="numeric"
                />
                
                <Text style={styles.modalLabel}>Project Type:</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      projectData.projectType === 'website' && styles.optionButtonActive
                    ]}
                    onPress={() => setProjectData({...projectData, projectType: 'website'})}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      projectData.projectType === 'website' && styles.optionButtonTextActive
                    ]}>Website</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      projectData.projectType === 'app' && styles.optionButtonActive
                    ]}
                    onPress={() => setProjectData({...projectData, projectType: 'app'})}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      projectData.projectType === 'app' && styles.optionButtonTextActive
                    ]}>App</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      projectData.projectType === 'design' && styles.optionButtonActive
                    ]}
                    onPress={() => setProjectData({...projectData, projectType: 'design'})}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      projectData.projectType === 'design' && styles.optionButtonTextActive
                    ]}>Design</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Website Link:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter website link (optional)"
                  value={projectData.websiteLink}
                  onChangeText={(text) => setProjectData({...projectData, websiteLink: text})}
                />

                <Text style={styles.modalLabel}>Tasks:</Text>
                {tasks.map((task, index) => (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskNumber}>Task {index + 1}</Text>
                      <TouchableOpacity
                        style={styles.removeTaskButton}
                        onPress={() => removeTask(task.id)}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                    
                    <TextInput
                      style={styles.taskInput}
                      placeholder="Task title..."
                      value={task.title}
                      onChangeText={(text) => updateTask(task.id, 'title', text)}
                    />
                    
                    <TextInput
                      style={styles.taskInput}
                      placeholder="Task description..."
                      value={task.description}
                      onChangeText={(text) => updateTask(task.id, 'description', text)}
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                    />
                    
                    <View style={styles.taskTypeGroup}>
                      <TouchableOpacity
                        style={[
                          styles.taskTypeButton,
                          task.type === 'Need Media' && styles.taskTypeButtonActive
                        ]}
                        onPress={() => updateTask(task.id, 'type', 'Need Media')}
                      >
                        <Ionicons name="cloud-upload" size={16} color={task.type === 'Need Media' ? COLORS.white : COLORS.darkGray} />
                        <Text style={[
                          styles.taskTypeText,
                          task.type === 'Need Media' && styles.taskTypeTextActive
                        ]}>Media</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.taskTypeButton,
                          task.type === 'Need Feedback' && styles.taskTypeButtonActive
                        ]}
                        onPress={() => updateTask(task.id, 'type', 'Need Feedback')}
                      >
                        <Ionicons name="chatbubble-ellipses" size={16} color={task.type === 'Need Feedback' ? COLORS.white : COLORS.darkGray} />
                        <Text style={[
                          styles.taskTypeText,
                          task.type === 'Need Feedback' && styles.taskTypeTextActive
                        ]}>Feedback</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={addTask}
                >
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                  <Text style={styles.addTaskText}>Add Task</Text>
                </TouchableOpacity>
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={createProjectAndTasks}
                  disabled={creatingProject}
                >
                  {creatingProject ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalConfirmText}>Create Project</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  refreshButton: {
    padding: 5,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 15,
  },
  selectUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  selectedUser: {
    flex: 1,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  selectedUserEmail: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectUserText: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  createProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
  },
  createProjectText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  userBusiness: {
    fontSize: 12,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 10,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 5,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  debugButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%', // Increased from 80% to 90%
    minHeight: 400, // Add minimum height
  },
  modalScrollView: {
    flex: 1,
    marginBottom: 20,
    maxHeight: 500, // Add maximum height for scroll view
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  optionButtonTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  taskItem: {
    backgroundColor: COLORS.gray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  removeTaskButton: {
    padding: 4,
  },
  taskInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  taskTypeGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  taskTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 4,
  },
  taskTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskTypeText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  taskTypeTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 20,
  },
  addTaskText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userList: {
    maxHeight: 300,
  },
  modalUserItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  modalUserEmail: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
});

export default AssignProjectsScreen; 