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
          } else if (filter === 'completed') {
            filteredProjects = allProjects.filter(p => p.status === 'completed');
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
    if (filter === 'completed') return 'Completed Projects';
    if (filter === 'my') return 'My Projects';
    return 'Projects';
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
                <Ionicons name={filter === 'completed' ? "checkmark-done-circle" : "folder-open"} size={64} color={COLORS.darkGray} />
                <Text style={styles.emptyTitle}>
                  {filter === 'completed' ? 'No Completed Projects' : 'No Ongoing Projects'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filter === 'completed' 
                    ? 'No projects have been completed yet.'
                    : 'You don\'t have any ongoing projects yet.'
                  }
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
                  
                  {/* Action buttons */}
                  <View style={styles.actionButtons}>
                    
                    {/* Admin: Complete Project button */}
                    {isAdmin && project.status !== 'completed' && (
                      <TouchableOpacity
                        style={[styles.addTaskButton, { borderColor: COLORS.danger, backgroundColor: 'transparent' }]}
                        onPress={() => completeProject(project.id)}
                      >
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.danger} />
                        <Text style={[styles.addTaskText, { color: COLORS.danger }]}>Complete Project</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Website button for all users */}
                    {project.website_link && (
                      <TouchableOpacity
                        style={[styles.addTaskButton, { backgroundColor: COLORS.primary }]}
                        onPress={() => {
                          const url = project.website_link.startsWith('http') 
                            ? project.website_link 
                            : `https://${project.website_link}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Ionicons name="globe" size={20} color={COLORS.white} />
                        <Text style={[styles.addTaskText, { color: COLORS.white }]}>View Website</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>


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
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalScrollView: {
    flex: 1,
    marginBottom: 20,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    marginTop: 8,
  },
  taskItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskNumber: {
    fontSize: 16,
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
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    minHeight: 44,
  },
  priorityGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  priorityButtonTextActive: {
    color: COLORS.white,
  },
  taskTypeGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 16,
    gap: 8,
  },
  taskTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  taskTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskTypeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTypeTextActive: {
    color: COLORS.white,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  modalCancelButton: {
    backgroundColor: COLORS.gray,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTaskState: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTaskText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProjectsScreen; 