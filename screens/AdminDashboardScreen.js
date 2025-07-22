import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';

const { width } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { taskResponseService } from '../services/taskResponseService';
import { auth } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { runAllTests } from '../test-upload';

const AdminDashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingResponses: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'Need Media',
    assigned_user_id: '',
    reviewMedia: [],
  });
  const [allUsers, setAllUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    loadAdminData();
    loadUsers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAdminData();
    }, [])
  );

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userData = await authService.getUserData(currentUser.uid);
        setUser(userData);
        
        // Load admin stats with error handling for each service
        let allProjects = [];
        let allTasks = [];
        
        try {
          allProjects = await projectService.getAllProjects();
        } catch (error) {
          console.error('Error loading projects:', error);
        }
        
        try {
          allTasks = await taskService.getAllTasks();
        } catch (error) {
          console.error('Error loading tasks:', error);
        }
        
        const activeProjects = allProjects.filter(p => p.status === 'in-progress');
        const completedProjects = allProjects.filter(p => p.status === 'completed');
        const pendingResponses = allTasks.filter(t => t.status === 'resolved');
        
        setStats({
          totalProjects: allProjects.length,
          activeProjects: activeProjects.length,
          pendingResponses: pendingResponses.length,
          completedProjects: completedProjects.length
        });
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Set default stats on error
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        pendingResponses: 0,
        completedProjects: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Add navigation handlers for stats
  const handleTotalProjectsPress = () => {
    navigation.navigate('Projects', { filter: 'all' });
  };
  const handleActiveProjectsPress = () => {
    navigation.navigate('Projects', { filter: 'active' });
  };
  const handleCompletedProjectsPress = () => {
    navigation.navigate('Projects', { filter: 'completed' });
  };

  // Load users for task assignment
  const loadUsers = async () => {
    try {
      const users = await userService.getAllUsers();
      const activeUsers = users.filter(user => user.role === 'user');
      setAllUsers(activeUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setAllUsers([]);
    }
  };

  // Pick media for review tasks
  const pickMedia = async () => {
    try {
      setUploadingMedia(true);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: asset.type || 'image',
          fileName: asset.fileName || `media_${Date.now()}_${index}.jpg`,
        }));
        
        setNewTask(prev => ({
          ...prev,
          reviewMedia: [...(prev.reviewMedia || []), ...newMedia]
        }));
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    } finally {
      setUploadingMedia(false);
    }
  };

  // Remove media from review task
  const removeMedia = (index) => {
    setNewTask(prev => ({
      ...prev,
      reviewMedia: prev.reviewMedia.filter((_, i) => i !== index)
    }));
  };

  // Test function to diagnose upload issues
  const runDiagnosticTests = async () => {
    try {
      console.log('🔍 Starting diagnostic tests...');
      const results = await runAllTests();
      console.log('📊 Diagnostic test results:', results);
      
      Alert.alert(
        'Diagnostic Results',
        `Simple Upload: ${results.simpleUpload ? '✅' : '❌'}\n` +
        `Base64 Upload: ${results.base64Upload ? '✅' : '❌'}\n` +
        `File System Upload: ${results.fileSystemUpload ? '✅' : '❌'}\n` +
        `Firebase SDK: ${results.firebaseSDK ? '✅' : '❌'}`
      );
    } catch (error) {
      console.error('❌ Diagnostic test failed:', error);
      Alert.alert('Test Failed', 'Error running diagnostic tests: ' + error.message);
    }
  };

  // Create new task
  const createNewTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.assigned_user_id) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newTask.type === 'Review Task' && newTask.reviewMedia.length === 0) {
      Alert.alert('Error', 'Please upload at least one media file for review tasks');
      return;
    }

    try {
      let taskData = {
        ...newTask,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignedBy: auth.currentUser?.uid || 'admin',
        status: 'pending',
      };

      // If it's a review task, upload media files first
      if (newTask.type === 'Review Task' && newTask.reviewMedia.length > 0) {
        const uploadedMedia = [];
        
        for (const media of newTask.reviewMedia) {
          try {
            // Create a temporary task ID for media upload
            const tempTaskId = `temp_${Date.now()}`;
            const tempUserId = newTask.assigned_user_id;
            
            const mediaFile = {
              uri: media.uri,
              fileName: media.fileName || `media_${Date.now()}.jpg`,
              mimeType: media.type === 'video' ? 'video/mp4' : 'image/jpeg'
            };
            
            const mediaUrl = await taskResponseService.uploadMediaFile(tempTaskId, tempUserId, mediaFile);
            uploadedMedia.push({
              url: mediaUrl,
              type: media.type,
              fileName: media.fileName || 'unknown_file',
            });
          } catch (error) {
            console.error('Error uploading media file:', error);
            Alert.alert('Error', `Failed to upload media file: ${error.message}`);
            return;
          }
        }
        
        taskData.reviewMedia = uploadedMedia;
      }

      await taskService.createTask(taskData);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        type: 'Need Media',
        assigned_user_id: '',
        reviewMedia: [],
      });
      setShowUserDropdown(false);
      setShowAddTaskModal(false);
      
      Alert.alert('Success', 'Task created successfully!');
      
      // Reload admin data to update stats
      await loadAdminData();
      
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const adminMenuItems = [
    {
      id: 'add-task',
      title: 'Add Task',
      subtitle: 'Create new tasks for clients to complete',
      icon: 'add-circle',
      color: COLORS.primary,
      gradient: [COLORS.danger, '#FF8C00'], // Red to Orange
      onPress: () => setShowAddTaskModal(true),
    },
    {
      id: 'assign-projects',
      title: 'Assign Projects',
      subtitle: 'Create new projects and assign tasks to clients',
      icon: 'folder',
      color: COLORS.secondary,
      gradient: [COLORS.secondary, COLORS.danger],
      onPress: () => navigation.navigate('AssignProjects'),
    },
    {
      id: 'admin-notifications',
      title: 'Client Responses',
      subtitle: 'Review uploaded media and feedback from clients',
      icon: 'folder-open',
      color: COLORS.accent,
      gradient: [COLORS.accent, COLORS.primary],
      onPress: () => navigation.navigate('AdminNotifications'),
    },
    {
      id: 'diagnostic-test',
      title: 'Test Upload',
      subtitle: 'Run diagnostic tests for media upload issues',
      icon: 'bug',
      color: COLORS.darkGray,
      gradient: [COLORS.darkGray, '#666'],
      onPress: runDiagnosticTests,
    },
  ];

  const quickStats = [
    { 
      label: 'Total Projects', 
      value: stats.totalProjects.toString(), 
      icon: 'folder',
      onPress: handleTotalProjectsPress
    },
    { 
      label: 'Active Projects', 
      value: stats.activeProjects.toString(), 
      icon: 'folder-open',
      onPress: handleActiveProjectsPress
    },
    { 
      label: 'Pending Responses', 
      value: stats.pendingResponses.toString(), 
      icon: 'notifications',
      onPress: () => navigation.navigate('AdminNotifications')
    },
    { 
      label: 'Completed Projects', 
      value: stats.completedProjects.toString(), 
      icon: 'checkmark-done-circle',
      onPress: handleCompletedProjectsPress
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
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
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                Welcome, {user?.fullName?.split(' ')[0] || 'User'}! 👋
              </Text>
              <Text style={styles.subtitle}>
                Hello Habanero CRM - Admin Panel
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              {user?.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person" size={24} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Dashboard Overview</Text>
              <View style={styles.statsGrid}>
                {quickStats.map((stat, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.statCard}
                    onPress={stat.onPress}
                    disabled={!stat.onPress}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                      style={styles.statCardGradient}
                    >
                      <View style={styles.statIconContainer}>
                        <Ionicons name={stat.icon} size={24} color={COLORS.primary} />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Admin Menu */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.menuGrid}>
                {adminMenuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuCard}
                    onPress={item.onPress}
                  >
                    <LinearGradient
                      colors={item.gradient}
                      style={styles.menuCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.menuCardContent}>
                        <View style={styles.menuCardIcon}>
                          <Ionicons name={item.icon} size={32} color={COLORS.white} />
                        </View>
                        <Text style={styles.menuCardTitle}>{item.title}</Text>
                        <Text style={styles.menuCardSubtitle}>{item.subtitle}</Text>
                      </View>
                      <View style={styles.menuCardOverlay}>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Add Task Modal */}
        <Modal
          visible={showAddTaskModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Task</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowAddTaskModal(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.darkGray} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <ScrollView 
                  style={styles.modalScrollView} 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Task Name */}
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Task Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter task name..."
                    value={newTask.title}
                    onChangeText={(text) => setNewTask({...newTask, title: text})}
                  />
                </View>
                
                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Enter task description..."
                    value={newTask.description}
                    onChangeText={(text) => setNewTask({...newTask, description: text})}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                
                {/* User Assignment */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Assign To User *</Text>
                  <TouchableOpacity
                    style={styles.userDropdown}
                    onPress={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !newTask.assigned_user_id && styles.placeholderText
                    ]}>
                      {newTask.assigned_user_id 
                        ? allUsers.find(u => u.id === newTask.assigned_user_id)?.fullName || 'Unknown User'
                        : 'Select a user to assign task...'
                      }
                    </Text>
                    <Ionicons 
                      name={showUserDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={COLORS.darkGray} 
                    />
                  </TouchableOpacity>
                  
                  {showUserDropdown && (
                    <View style={styles.dropdownContainer}>
                      <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
                        {allUsers.length > 0 ? (
                          allUsers.map((user) => (
                            <TouchableOpacity
                              key={user.id}
                              style={[
                                styles.userItem,
                                newTask.assigned_user_id === user.id && styles.selectedUserItem
                              ]}
                              onPress={() => {
                                setNewTask({...newTask, assigned_user_id: user.id});
                                setShowUserDropdown(false);
                              }}
                            >
                              <Text style={[
                                styles.userItemText,
                                newTask.assigned_user_id === user.id && styles.selectedUserItemText
                              ]}>
                                {user.fullName} ({user.email})
                              </Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <View style={styles.userItem}>
                            <Text style={styles.userItemText}>No users available</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                {/* Task Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Task Type</Text>
                  <View style={styles.taskTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.taskTypeButton,
                        newTask.type === 'Need Media' && styles.activeTaskTypeButton
                      ]}
                      onPress={() => setNewTask({...newTask, type: 'Need Media'})}
                    >
                      <Ionicons 
                        name="cloud-upload" 
                        size={16} 
                        color={newTask.type === 'Need Media' ? COLORS.white : COLORS.darkGray} 
                      />
                      <Text style={[
                        styles.taskTypeText,
                        newTask.type === 'Need Media' && styles.activeTaskTypeText
                      ]}>Media Needed</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.taskTypeButton,
                        newTask.type === 'Need Feedback' && styles.activeTaskTypeButton
                      ]}
                      onPress={() => setNewTask({...newTask, type: 'Need Feedback'})}
                    >
                      <Ionicons 
                        name="chatbubble-ellipses" 
                        size={16} 
                        color={newTask.type === 'Need Feedback' ? COLORS.white : COLORS.darkGray} 
                      />
                      <Text style={[
                        styles.taskTypeText,
                        newTask.type === 'Need Feedback' && styles.activeTaskTypeText
                      ]}>Feedback Needed</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.taskTypeButton,
                        newTask.type === 'Review Task' && styles.activeTaskTypeButton
                      ]}
                      onPress={() => setNewTask({...newTask, type: 'Review Task'})}
                    >
                      <Ionicons 
                        name="eye" 
                        size={16} 
                        color={newTask.type === 'Review Task' ? COLORS.white : COLORS.darkGray} 
                      />
                      <Text style={[
                        styles.taskTypeText,
                        newTask.type === 'Review Task' && styles.activeTaskTypeText
                      ]}>Review Work</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Review Task Media Upload */}
                {newTask.type === 'Review Task' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Upload Media for Review Work *</Text>
                    
                    {uploadingMedia ? (
                      <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.uploadingText}>Processing...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={pickMedia}
                      >
                        <Ionicons name="image" size={20} color={COLORS.white} />
                        <Text style={styles.uploadButtonText}>Pick Media Files</Text>
                      </TouchableOpacity>
                    )}
                    
                    {newTask.reviewMedia.length > 0 && (
                      <View style={styles.mediaPreviewContainer}>
                        <Text style={styles.mediaPreviewTitle}>
                          Selected Media ({newTask.reviewMedia.length}):
                        </Text>
                        <View style={styles.mediaGrid}>
                          {newTask.reviewMedia.map((media, index) => (
                            <View key={index} style={styles.mediaPreviewItem}>
                              <Image
                                source={{ uri: media.uri }}
                                style={styles.mediaPreviewImage}
                                resizeMode="cover"
                              />
                              <TouchableOpacity
                                style={styles.removeMediaButton}
                                onPress={() => removeMedia(index)}
                              >
                                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
                              </ScrollView>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddTaskModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    (!newTask.title || !newTask.description || !newTask.assigned_user_id || 
                     (newTask.type === 'Review Task' && newTask.reviewMedia.length === 0)) && 
                    styles.disabledButton
                  ]}
                  onPress={createNewTask}
                  disabled={!newTask.title || !newTask.description || !newTask.assigned_user_id || 
                           (newTask.type === 'Review Task' && newTask.reviewMedia.length === 0)}
                >
                  <Text style={styles.createButtonText}>Create Task</Text>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '500',
  },
  profileButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.25)',
    // Optionally add backdropFilter for web
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  menuSection: {
    marginBottom: 30,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuCardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.25)',
    // Optionally add backdropFilter for web
  },
  menuCardContent: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  menuCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 6,
  },
  menuCardSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  menuCardOverlay: {
    position: 'absolute',
    right: 25,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  activitySection: {
    marginBottom: 30,
  },
  activityCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityCardGradient: {
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '400',
  },
  activityDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    height: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  userDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  dropdownContainer: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    marginTop: 5,
  },
  userList: {
    maxHeight: 150,
  },
  userItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedUserItem: {
    backgroundColor: COLORS.primary,
  },
  userItemText: {
    fontSize: 14,
    color: COLORS.black,
  },
  selectedUserItemText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  taskTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  taskTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    gap: 6,
    marginHorizontal: 2,
  },
  activeTaskTypeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskTypeText: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTaskTypeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  uploadingText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  mediaPreviewContainer: {
    marginTop: 12,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaPreviewItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.6,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminDashboardScreen; 