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
import { taskService } from '../services/taskService';
import { taskResponseService } from '../services/taskResponseService';
import { auth } from '../firebase';

const AdminNotificationsScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [completionModal, setCompletionModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [createTaskModal, setCreateTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'Need Media',
    priority: 'medium',
    assigned_user_id: '',
  });
  const [projectFilter, setProjectFilter] = useState('');
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Load all task responses
      const allResponses = await taskResponseService.getAllTaskResponses();
      
      // Get all tasks to match with responses
      const allTasks = await taskService.getAllTasks();
      
      // Create a map of task responses by task ID
      const responsesByTask = {};
      allResponses.forEach(response => {
        if (!responsesByTask[response.task_id]) {
          responsesByTask[response.task_id] = [];
        }
        responsesByTask[response.task_id].push(response);
      });
      
      // Filter for tasks that have responses or are resolved
      const tasksWithResponses = allTasks.filter(task => 
        task.status === 'resolved' || responsesByTask[task.id]?.length > 0
      );
      
      // Add responses to each task
      const tasksWithData = tasksWithResponses.map(task => ({
        ...task,
        responses: responsesByTask[task.id] || []
      }));
      
      setTasks(tasksWithData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projects = await require('../services/projectService').projectService.getAllProjects();
      setAllProjects(projects);
    } catch (error) {
      setAllProjects([]);
    }
  };

  const filteredTasks = projectFilter
    ? tasks.filter(task => {
        const project = allProjects.find(p => p.id === task.project_id);
        return project && project.title.toLowerCase().includes(projectFilter.toLowerCase());
      })
    : tasks;

  const openCompletionModal = (task) => {
    setCompletingTask(task);
    setAdminNotes('');
    setCompletionModal(true);
  };

  const completeTask = async () => {
    if (!completingTask) return;

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await taskService.completeTask(completingTask.id, {
          adminId: currentUser.uid,
          notes: adminNotes,
        });
        
        setCompletionModal(false);
        setCompletingTask(null);
        setAdminNotes('');
        
        // Reload tasks to update the list
        await loadTasks();
        
        Alert.alert('Success', 'Task completed successfully!');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const createNewTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.assigned_user_id) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await taskService.createTask({
        ...newTask,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignedBy: auth.currentUser?.uid || 'admin',
      });
      
      setCreateTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        instructions: '',
        type: 'Need Media',
        priority: 'medium',
        assigned_user_id: '',
      });
      
      Alert.alert('Success', 'Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
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

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case 'Need Media': return 'cloud-upload';
      case 'Notes': return 'document-text';
      default: return 'checkmark-circle';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date.toDate ? date.toDate() : date).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return COLORS.primary;
      case 'completed': return COLORS.secondary;
      default: return COLORS.darkGray;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
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
          <Text style={styles.title}>Admin Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Project Filter */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 }}>Filter by Project Name:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: COLORS.primary,
                borderRadius: 8,
                padding: 8,
                backgroundColor: COLORS.white,
                marginBottom: 4,
              }}
              placeholder="Type project name..."
              value={projectFilter}
              onChangeText={setProjectFilter}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off" size={64} color={COLORS.darkGray} />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySubtitle}>
                  No client responses require your attention.
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => {
                const project = allProjects.find(p => p.id === task.project_id);
                return (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <View style={styles.taskTitleContainer}>
                        <Ionicons 
                          name={getTaskTypeIcon(task.type)} 
                          size={20} 
                          color={COLORS.primary} 
                          style={styles.taskIcon}
                        />
                        <Text style={styles.taskTitle}>{task.title}</Text>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}> 
                        <Text style={styles.priorityText}>{task.priority}</Text>
                      </View>
                    </View>
                    <Text style={styles.taskDescription}>{task.description}</Text>
                    {project && (
                      <Text style={{ color: COLORS.primary, fontWeight: 'bold', marginBottom: 4 }}>
                        Project: {project.title}
                      </Text>
                    )}
                    <View style={styles.clientResponseContainer}>
                      <Text style={styles.clientResponseTitle}>Client Responses:</Text>
                      {task.responses && task.responses.length > 0 ? (
                        task.responses.map((response, index) => (
                          <View key={index} style={styles.responseItem}>
                            <Text style={styles.responseDate}>
                              Submitted: {formatDate(response.submitted_at)}
                            </Text>
                            {response.notes && (
                              <Text style={styles.responseNotes}>
                                Notes: {response.notes}
                              </Text>
                            )}
                            {response.media_files && response.media_files.length > 0 && (
                              <View style={styles.mediaInfo}>
                                <Text style={styles.mediaInfoTitle}>
                                  Media Files ({response.media_files.length}):
                                </Text>
                                {response.media_files.map((media, mediaIndex) => (
                                  <TouchableOpacity
                                    key={mediaIndex}
                                    style={styles.mediaFileItem}
                                    onPress={() => {
                                      // Open media file in browser
                                      if (media.url) {
                                        window.open(media.url, '_blank');
                                      } else {
                                        Alert.alert('No URL', 'No download URL available for this file.');
                                      }
                                    }}
                                  >
                                    <Ionicons name="document" size={16} color={COLORS.primary} />
                                    <Text style={styles.mediaFileName}>
                                      {media.fileName}
                                    </Text>
                                    <Ionicons name="download" size={16} color={COLORS.primary} />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        ))
                      ) : (
                        <Text style={styles.clientResponseText}>
                          No responses provided yet
                        </Text>
                      )}
                    </View>

                  <View style={styles.taskDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color={COLORS.darkGray} />
                      <Text style={styles.detailText}>User ID: {task.assigned_user_id}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color={COLORS.darkGray} />
                      <Text style={styles.detailText}>
                        Resolved: {formatDate(task.resolvedAt)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color={COLORS.darkGray} />
                      <Text style={styles.detailText}>
                        Created: {formatDate(task.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => openCompletionModal(task)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                      <Text style={styles.completeButtonText}>Mark Complete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          </ScrollView>
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateTaskModal(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Completion Modal */}
        <Modal
          visible={completionModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Complete Task</Text>
              <Text style={styles.modalSubtitle}>
                {completingTask?.title}
              </Text>
              
              <Text style={styles.modalLabel}>Admin Notes (optional):</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Add any notes about completing this task..."
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setCompletionModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={completeTask}
                >
                  <Text style={styles.modalConfirmText}>Complete Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Create Task Modal */}
        <Modal
          visible={createTaskModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              
              <Text style={styles.modalLabel}>Task Title *:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter task title..."
                value={newTask.title}
                onChangeText={(text) => setNewTask({...newTask, title: text})}
              />
              
              <Text style={styles.modalLabel}>Description *:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter task description..."
                value={newTask.description}
                onChangeText={(text) => setNewTask({...newTask, description: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <Text style={styles.modalLabel}>Instructions:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter detailed instructions..."
                value={newTask.instructions}
                onChangeText={(text) => setNewTask({...newTask, instructions: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <Text style={styles.modalLabel}>User ID *:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter user ID to assign task..."
                value={newTask.assigned_user_id}
                onChangeText={(text) => setNewTask({...newTask, assigned_user_id: text})}
              />
              
              <Text style={styles.modalLabel}>Task Type:</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newTask.type === 'Need Media' && styles.optionButtonActive
                  ]}
                  onPress={() => setNewTask({...newTask, type: 'Need Media'})}
                >
                  <Text style={[
                    styles.optionButtonText,
                    newTask.type === 'Need Media' && styles.optionButtonTextActive
                  ]}>Need Media</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newTask.type === 'Notes' && styles.optionButtonActive
                  ]}
                  onPress={() => setNewTask({...newTask, type: 'Notes'})}
                >
                  <Text style={[
                    styles.optionButtonText,
                    newTask.type === 'Notes' && styles.optionButtonTextActive
                  ]}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newTask.type === 'Other' && styles.optionButtonActive
                  ]}
                  onPress={() => setNewTask({...newTask, type: 'Other'})}
                >
                  <Text style={[
                    styles.optionButtonText,
                    newTask.type === 'Other' && styles.optionButtonTextActive
                  ]}>Other</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalLabel}>Priority:</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newTask.priority === 'low' && styles.optionButtonActive
                  ]}
                  onPress={() => setNewTask({...newTask, priority: 'low'})}
                >
                  <Text style={[
                    styles.optionButtonText,
                    newTask.priority === 'low' && styles.optionButtonTextActive
                  ]}>Low</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newTask.priority === 'medium' && styles.optionButtonActive
                  ]}
                  onPress={() => setNewTask({...newTask, priority: 'medium'})}
                >
                  <Text style={[
                    styles.optionButtonText,
                    newTask.priority === 'medium' && styles.optionButtonTextActive
                  ]}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newTask.priority === 'high' && styles.optionButtonActive
                  ]}
                  onPress={() => setNewTask({...newTask, priority: 'high'})}
                >
                  <Text style={[
                    styles.optionButtonText,
                    newTask.priority === 'high' && styles.optionButtonTextActive
                  ]}>High</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setCreateTaskModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={createNewTask}
                >
                  <Text style={styles.modalConfirmText}>Create Task</Text>
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
  },
  taskCard: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIcon: {
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
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
  taskDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  clientResponseContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  clientResponseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  clientResponseText: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 8,
  },
  resolutionNotes: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  mediaInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  mediaInfoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  mediaFileName: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginLeft: 8,
  },
  taskDetails: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
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
    marginBottom: 20,
    minHeight: 100,
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
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
  // New styles for response items
  responseItem: {
    backgroundColor: COLORS.gray,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  responseDate: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  responseNotes: {
    fontSize: 13,
    color: COLORS.black,
    marginBottom: 4,
    lineHeight: 18,
  },
  mediaFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
});

export default AdminNotificationsScreen; 