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
import { projectService } from '../services/projectService';
import { auth } from '../firebase';

const AdminNotificationsScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [completionModal, setCompletionModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadTasks(),
          loadProjects()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
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
      const projects = await projectService.getAllProjects();
      setAllProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
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
      case 'Need Feedback': return 'document-text';
      case 'Review Task': return 'eye';
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
      case 'approved': return COLORS.success;
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
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
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
    gap: 4,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
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
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    minHeight: 44,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  dropdownList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primary,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.black,
  },
  dropdownItemTextSelected: {
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
  // New styles for media upload section
  mediaUploadSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  pickMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  pickMediaButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  uploadedMediaList: {
    marginTop: 12,
  },
  uploadedMediaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  uploadedMediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  uploadedMediaImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 10,
  },
  removeMediaButton: {
    padding: 5,
  },
  // NEW MODAL STYLES
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  closeButton: {
    padding: 5,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    gap: 6,
  },
  activeTaskTypeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskTypeText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  activeTaskTypeText: {
    color: COLORS.white,
    fontWeight: 'bold',
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

export default AdminNotificationsScreen; 