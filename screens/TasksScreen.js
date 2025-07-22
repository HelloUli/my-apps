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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { taskService } from '../services/taskService';
import { taskResponseService } from '../services/taskResponseService';
import { taskReviewService } from '../services/taskReviewService';
import { projectService } from '../services/projectService';
import { auth } from '../firebase';

const TasksScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskResponses, setTaskResponses] = useState({});
  const [notesByTaskId, setNotesByTaskId] = useState({}); // <-- NEW
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submittingMedia, setSubmittingMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Get filter from navigation params
  const filter = route?.params?.filter || 'pending';

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('Loading tasks for user:', currentUser.uid);
        let userTasks = [];
        
        try {
          // First, get all projects assigned to the current user
          const userProjects = await projectService.getUserProjects(currentUser.uid);
          console.log('User projects found:', userProjects.length);
          
          // Then, get all tasks for those projects
          for (const project of userProjects) {
            try {
              const projectTasks = await taskService.getProjectTasks(project.id);
              userTasks = [...userTasks, ...projectTasks];
              console.log(`Tasks for project ${project.title}:`, projectTasks.length);
            } catch (error) {
              console.error(`Error loading tasks for project ${project.id}:`, error);
            }
          }
          
          // Also try direct user tasks as fallback
          try {
            const directUserTasks = await taskService.getUserTasks(currentUser.uid);
            console.log('Direct user tasks found:', directUserTasks.length);
            userTasks = [...userTasks, ...directUserTasks];
          } catch (error) {
            console.error('Error loading direct user tasks:', error);
          }
          
          // Remove duplicates based on task ID
          const uniqueTasks = userTasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          );
          
          console.log('Total unique tasks loaded:', uniqueTasks.length);
          console.log('Task statuses:', uniqueTasks.map(t => ({ id: t.id, status: t.status, title: t.title })));
          
          userTasks = uniqueTasks;
          
        } catch (error) {
          console.error('Error loading tasks:', error);
          userTasks = [];
        }
        
        // Load task responses for each task
        const responsesMap = {};
        for (const task of userTasks) {
          try {
            const responses = await taskResponseService.getTaskResponses(task.id);
            responsesMap[task.id] = responses;
            console.log(`Responses for task ${task.id}:`, responses.length);
          } catch (error) {
            console.error(`Error loading responses for task ${task.id}:`, error);
            responsesMap[task.id] = [];
          }
        }
        setTaskResponses(responsesMap);
        
        // Filter tasks based on filter param
        let filteredTasks = userTasks;
        if (filter === 'pending') {
          filteredTasks = userTasks.filter(t => t.status === 'pending');
          console.log('Pending tasks after filter:', filteredTasks.length);
        } else if (filter === 'completed') {
          filteredTasks = userTasks.filter(t => t.status === 'completed');
        } else if (filter === 'resolved') {
          filteredTasks = userTasks.filter(t => t.status === 'resolved');
        }
        
        console.log('Final filtered tasks:', filteredTasks.length);
        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to sync notesByTaskId with tasks
  useEffect(() => {
    setNotesByTaskId(prev => {
      const updated = { ...prev };
      tasks.forEach(task => {
        if (!(task.id in updated)) updated[task.id] = '';
      });
      return updated;
    });
  }, [tasks]);

  const pickMedia = async (taskId) => {
    try {
      setUploadingMedia(true);
      // Always check and request permissions every time, and keep prompting until granted or user cancels
      let status = null;
      let permissionResult = null;
      do {
        const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
        status = perm.status;
        if (status !== 'granted') {
          permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          status = permissionResult.status;
        }
        if (status !== 'granted') {
          const tryAgain = await new Promise((resolve) => {
            Alert.alert(
              'Permission needed',
              'Please grant permission to access your media library. You must allow access to upload media.',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Try Again', onPress: () => resolve(true) },
              ],
              { cancelable: false }
            );
          });
          if (!tryAgain) {
            setUploadingMedia(false);
            return;
          }
        }
      } while (status !== 'granted');
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          fileSize: asset.fileSize || 0,
          mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        }));
        setSubmittingMedia(prev => [...prev, ...newMedia]);
        Alert.alert('Success', `${newMedia.length} media file(s) selected`);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index) => {
    setSubmittingMedia(prev => prev.filter((_, i) => i !== index));
  };

  // New function to approve review tasks
  const approveReviewTask = async (taskId) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await taskReviewService.approveReviewTask(taskId, currentUser.uid);
        
        // Reload tasks to update the list
        await loadTasks();
        
        Alert.alert('Success', 'Review task approved successfully!');
      }
    } catch (error) {
      console.error('Error approving review task:', error);
      Alert.alert('Error', 'Failed to approve review task');
    }
  };

  // New function to expand media
  const expandMedia = (media) => {
    setExpandedMedia(media);
    setShowMediaModal(true);
  };

  const submitTaskResponse = async (taskId) => {
    const notes = notesByTaskId[taskId] || '';
    if (!notes.trim() && submittingMedia.length === 0) {
      Alert.alert('Error', 'Please add notes or upload media before submitting');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Submit task response
        await taskResponseService.submitTaskResponse(taskId, currentUser.uid, {
          notes: notes,
          mediaFiles: submittingMedia
        });
        
        // Mark task as resolved
        await taskService.resolveTask(taskId, {
          userId: currentUser.uid,
          notes: notes,
          response: `Task response submitted with ${submittingMedia.length} media file(s)`,
          uploadedMedia: submittingMedia.map(m => ({ fileName: m.fileName }))
        });
        
        // Reset form
        setSubmittingTask(null);
        setSubmittingMedia([]);
        setNotesByTaskId(prev => ({ ...prev, [taskId]: '' }));
        
        // Reload tasks to update the list
        await loadTasks();
        
        Alert.alert('Success', 'Task response submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting task response:', error);
      Alert.alert('Error', 'Failed to submit task response');
    }
  };

  const startTaskSubmission = (task) => {
    console.log('Starting task submission for task:', task.id, task.title);
    setSubmittingTask(task);
    setSubmittingMedia([]);
  };

  const cancelTaskSubmission = () => {
    setSubmittingTask(null);
    setSubmittingMedia([]);
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
      case 'Need Feedback': return 'chatbubble-ellipses';
      case 'Review Task': return 'eye';
      case 'Notes': return 'document-text';
      default: return 'checkmark-circle';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date.toDate ? date.toDate() : date).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate.toDate ? dueDate.toDate() : dueDate) < new Date();
  };

  // Update header title based on filter
  const getTitle = () => {
    if (filter === 'pending') return 'Pending Tasks';
    if (filter === 'completed') return 'Completed Tasks';
    if (filter === 'all') return 'All Tasks';
    return 'Tasks';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
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
          {/* Remove the add button (plus icon) from the header or anywhere in the TasksScreen */}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {tasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.darkGray} />
                <Text style={styles.emptyTitle}>No Pending Tasks</Text>
                <Text style={styles.emptySubtitle}>
                  You're all caught up! No tasks require your attention.
                </Text>
              </View>
            ) : (
              tasks.map((task) => {
                const hasSubmitted = taskResponses[task.id] && taskResponses[task.id].length > 0;
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
                    {task.instructions && (
                      <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>Instructions:</Text>
                        <Text style={styles.instructionsText}>{task.instructions}</Text>
                      </View>
                    )}

                    <View style={styles.taskDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color={COLORS.darkGray} />
                        <Text style={[styles.detailText, isOverdue(task.dueDate) && styles.overdueText]}>
                          Due: {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate) && ' (Overdue)'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color={COLORS.darkGray} />
                        <Text style={styles.detailText}>Created: {formatDate(task.createdAt)}</Text>
                      </View>
                    </View>

                    {/* Always-visible response widget */}
                    <View style={styles.responseSection}>
                      <Text style={styles.responseTitle}>Your Response:</Text>
                      <TextInput
                        style={styles.notesInput}
                        placeholder="Add your notes about this task..."
                        value={notesByTaskId[task.id] || ''}
                        onChangeText={text => setNotesByTaskId(prev => ({ ...prev, [task.id]: text }))}
                        editable={!hasSubmitted}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        autoCorrect={true}
                        autoCapitalize="sentences"
                      />
                      <TouchableOpacity
                        style={[styles.uploadButton, hasSubmitted && { opacity: 0.5 }]}
                        onPress={() => !hasSubmitted && pickMedia(task.id)}
                        disabled={hasSubmitted || uploadingMedia}
                      >
                        {uploadingMedia && submittingTask?.id === task.id ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Ionicons name="cloud-upload" size={20} color={COLORS.white} />
                        )}
                        <Text style={styles.uploadButtonText}>
                          {uploadingMedia && submittingTask?.id === task.id ? 'Selecting...' : 'Upload Media Files'}
                        </Text>
                      </TouchableOpacity>
                      {submittingTask?.id === task.id && submittingMedia.length > 0 && (
                        <View style={styles.mediaPreview}>
                          <Text style={styles.mediaPreviewTitle}>Selected Media ({submittingMedia.length}):</Text>
                          {submittingMedia.map((media, index) => (
                            <View key={index} style={styles.mediaItem}>
                              <Text style={styles.mediaFileName}>{media.fileName}</Text>
                              <TouchableOpacity
                                style={styles.removeMediaButton}
                                onPress={() => removeMedia(index)}
                                disabled={hasSubmitted}
                              >
                                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                      <View style={styles.responseButtons}>
                        {!hasSubmitted && (
                          <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => {
                              setSubmittingTask(task);
                              submitTaskResponse(task.id);
                            }}
                            disabled={hasSubmitted || uploadingMedia || (!(notesByTaskId[task.id] && notesByTaskId[task.id].trim()) && submittingMedia.length === 0)}
                          >
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                            <Text style={styles.submitButtonText}>Submit & Complete</Text>
                          </TouchableOpacity>
                        )}
                        {hasSubmitted && (
                          <Text style={{ color: COLORS.primary, fontWeight: 'bold', marginTop: 8 }}>
                            Response submitted. You cannot edit this response.
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Show existing responses */}
                    {taskResponses[task.id] && taskResponses[task.id].length > 0 && (
                      <View style={styles.existingResponses}>
                        <Text style={styles.existingResponsesTitle}>Your Previous Response:</Text>
                        {taskResponses[task.id].map((response, index) => (
                          <View key={index} style={styles.responseItem}>
                            {response.notes && (
                              <Text style={styles.responseNotes}>{response.notes}</Text>
                            )}
                            {response.media_files && response.media_files.length > 0 && (
                              <Text style={styles.responseMedia}>
                                Media: {response.media_files.length} file(s) uploaded
                              </Text>
                            )}
                            <Text style={styles.responseDate}>
                              Submitted: {formatDate(response.submitted_at)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Review Task Specific UI */}
                    {task.type === 'Review Task' && task.reviewMedia && task.reviewMedia.length > 0 && (
                      <View style={styles.reviewSection}>
                        <Text style={styles.reviewTitle}>Media to Review:</Text>
                        <View style={styles.reviewMediaGrid}>
                          {task.reviewMedia.map((media, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.reviewMediaItem}
                              onPress={() => expandMedia(media)}
                            >
                              <Image
                                source={{ uri: media.url }}
                                style={styles.reviewMediaImage}
                                resizeMode="cover"
                              />
                              <View style={styles.reviewMediaOverlay}>
                                <Ionicons name="expand" size={20} color={COLORS.white} />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {task.status === 'pending' && (
                          <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => approveReviewTask(task.id)}
                          >
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                            <Text style={styles.approveButtonText}>Approve</Text>
                          </TouchableOpacity>
                        )}
                        {task.status === 'approved' && (
                          <View style={styles.approvedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={styles.approvedText}>Approved</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Media Expansion Modal */}
        <Modal
          visible={showMediaModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.mediaModalOverlay}>
            <View style={styles.mediaModalContent}>
              <TouchableOpacity
                style={styles.closeMediaButton}
                onPress={() => {
                  setShowMediaModal(false);
                  setExpandedMedia(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              {expandedMedia && (
                <Image
                  source={{ uri: expandedMedia.url }}
                  style={styles.expandedMediaImage}
                  resizeMode="contain"
                />
              )}
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
  instructionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
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
  overdueText: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  resolveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  resolveButtonText: {
    color: COLORS.white,
    fontSize: 16,
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
  uploadButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mediaPreview: {
    marginBottom: 16,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray,
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  mediaFileName: {
    fontSize: 12,
    color: COLORS.black,
    flex: 1,
  },
  removeMediaButton: {
    padding: 4,
  },
  // New styles for task response functionality
  responseSection: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  existingResponses: {
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  existingResponsesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  responseItem: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  responseNotes: {
    fontSize: 13,
    color: COLORS.black,
    marginBottom: 4,
    lineHeight: 18,
  },
  responseMedia: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  // Review task styles
  reviewSection: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  reviewMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reviewMediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  reviewMediaImage: {
    width: '100%',
    height: '100%',
  },
  reviewMediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approvedText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Media expansion modal styles
  mediaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeMediaButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  expandedMediaImage: {
    width: '100%',
    height: '100%',
  },
});

export default TasksScreen; 