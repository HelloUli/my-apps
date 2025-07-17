import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { projectService } from '../services/projectService';
import { auth } from '../firebase';
import { authService } from '../services/authService';
import { taskService } from '../services/taskService';

const ProjectsScreen = ({ navigation, route }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [addTaskProject, setAddTaskProject] = useState(null);
  const [newTasks, setNewTasks] = useState([]);
  const [addingTasks, setAddingTasks] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get filter from navigation params
  const filter = route?.params?.filter || 'my';

  useEffect(() => {
    loadProjects();
    checkAdmin();
  }, [filter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        let filteredProjects = [];
        if (filter === 'my') {
          // Only fetch projects assigned to the current user
          filteredProjects = await projectService.getUserProjects(currentUser.uid);
        } else {
          let allProjects = [];
          try {
            allProjects = await projectService.getAllProjects();
          } catch (error) {
            console.error('Error loading all projects:', error);
            allProjects = [];
          }
          if (filter === 'active') {
            filteredProjects = allProjects.filter(p => p.status === 'in-progress');
          } else {
            filteredProjects = allProjects;
          }
        }
        setProjects(filteredProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAdmin = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userData = await authService.getUserData(currentUser.uid);
      setIsAdmin(userData?.role === 'admin');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.danger;
      case 'medium': return COLORS.primary;
      case 'low': return COLORS.secondary;
      default: return COLORS.darkGray;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return COLORS.primary;
      case 'completed': return COLORS.secondary;
      case 'on-hold': return COLORS.danger;
      default: return COLORS.darkGray;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date.toDate ? date.toDate() : date).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Update header title based on filter
  const getTitle = () => {
    if (filter === 'all') return 'All Projects';
    if (filter === 'active') return 'Active Projects';
    if (filter === 'my') return 'My Projects';
    return 'Projects';
  };

  const openAddTaskModal = (project) => {
    setAddTaskProject(project);
    setNewTasks([]);
    setShowAddTaskModal(true);
  };

  const addTaskToList = () => {
    const newTask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'Need Media',
      priority: 'medium',
      instructions: ''
    };
    setNewTasks([...newTasks, newTask]);
  };

  const updateNewTask = (taskId, field, value) => {
    setNewTasks(newTasks.map(task =>
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const removeNewTask = (taskId) => {
    setNewTasks(newTasks.filter(task => task.id !== taskId));
  };

  const submitNewTasks = async () => {
    if (!addTaskProject || newTasks.length === 0) {
      Alert.alert('Error', 'Please add at least one task');
      return;
    }
    setAddingTasks(true);
    try {
      const currentUser = auth.currentUser;
      for (const task of newTasks) {
        if (task.title && task.description) {
          const taskData = {
            assigned_user_id: addTaskProject.assigned_user_id,
            project_id: addTaskProject.id,
            title: task.title,
            description: task.description,
            instructions: task.instructions,
            type: task.type,
            priority: task.priority,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            assignedBy: currentUser.uid,
            status: 'pending',
            createdAt: new Date(),
          };
          await taskService.createTask(taskData);
        }
      }
      setShowAddTaskModal(false);
      setAddTaskProject(null);
      setNewTasks([]);
      await loadProjects();
      Alert.alert('Success', 'Task(s) added to project!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add tasks: ' + error.message);
    } finally {
      setAddingTasks(false);
    }
  };

  const completeProject = async (projectId) => {
    try {
      await projectService.updateProject(projectId, {
        status: 'completed',
        progress: 100,
        updatedAt: new Date(),
      });
      await loadProjects();
      Alert.alert('Success', 'Project marked as completed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete project: ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading projects...</Text>
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
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadProjects}
            >
              <Ionicons name="refresh" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {projects.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open" size={64} color={COLORS.darkGray} />
                <Text style={styles.emptyTitle}>No Ongoing Projects</Text>
                <Text style={styles.emptySubtitle}>
                  You don't have any ongoing projects yet.
                </Text>
              </View>
            ) : (
              projects.map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectTitleContainer}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority) }]}>
                        <Text style={styles.priorityText}>{project.priority}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                      <Text style={styles.statusText}>{project.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.projectDescription}>{project.description}</Text>

                  <View style={styles.projectDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="business" size={16} color={COLORS.darkGray} />
                      <Text style={styles.detailText}>{project.clientName}</Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressText}>Progress</Text>
                      <Text style={styles.progressPercentage}>{project.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${project.progress}%`, backgroundColor: COLORS.primary }
                        ]} 
                      />
                    </View>
                  </View>
                  {/* Add Task button for admins */}
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.addTaskButton}
                      onPress={() => openAddTaskModal(project)}
                    >
                      <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                      <Text style={styles.addTaskText}>Add Task</Text>
                    </TouchableOpacity>
                  )}
                  {/* Admin: Complete Project button */}
                  {isAdmin && project.status !== 'completed' && (
                    <TouchableOpacity
                      style={[styles.addTaskButton, { backgroundColor: COLORS.secondary }]}
                      onPress={() => completeProject(project.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                      <Text style={[styles.addTaskText, { color: COLORS.white }]}>Complete Project</Text>
                    </TouchableOpacity>
                  )}
                  {/* User: See Website button */}
                  {!isAdmin && project.websiteLink && (
                    <TouchableOpacity
                      style={[styles.addTaskButton, { backgroundColor: COLORS.primary }]}
                      onPress={() => Linking.openURL(project.websiteLink)}
                    >
                      <Ionicons name="globe" size={20} color={COLORS.white} />
                      <Text style={[styles.addTaskText, { color: COLORS.white }]}>See Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
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
              <Text style={styles.modalTitle}>Add Task to Project</Text>
              <Text style={styles.modalSubtitle}>{addTaskProject?.title}</Text>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalLabel}>Tasks:</Text>
                {newTasks.map((task, index) => (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskNumber}>Task {index + 1}</Text>
                      <TouchableOpacity
                        style={styles.removeTaskButton}
                        onPress={() => removeNewTask(task.id)}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.taskInput}
                      placeholder="Task title..."
                      value={task.title}
                      onChangeText={text => updateNewTask(task.id, 'title', text)}
                    />
                    <TextInput
                      style={styles.taskInput}
                      placeholder="Task description..."
                      value={task.description}
                      onChangeText={text => updateNewTask(task.id, 'description', text)}
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
                        onPress={() => updateNewTask(task.id, 'type', 'Need Media')}
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
                        onPress={() => updateNewTask(task.id, 'type', 'Need Feedback')}
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
                  onPress={addTaskToList}
                >
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                  <Text style={styles.addTaskText}>Add Task</Text>
                </TouchableOpacity>
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowAddTaskModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={submitNewTasks}
                  disabled={addingTasks}
                >
                  {addingTasks ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalConfirmText}>Add Task(s)</Text>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 5,
    marginRight: 10,
  },
  addButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  projectCard: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  projectDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  projectDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  addTaskText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 18,
    color: COLORS.darkGray,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '100%',
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
    color: COLORS.primary,
  },
  removeTaskButton: {
    padding: 5,
  },
  taskInput: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: COLORS.black,
  },
  taskTypeGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 15,
  },
  taskTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  taskTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTypeTextActive: {
    color: COLORS.white,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  modalCancelButton: {
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalCancelText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProjectsScreen; 