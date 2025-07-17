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
} from 'react-native';

const { width } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { auth } from '../firebase';

const AdminDashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingResponses: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
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

  const adminMenuItems = [
    {
      id: 'assign-projects',
      title: 'Assign Projects',
      subtitle: 'Create new projects and assign tasks to clients',
      icon: 'add-circle',
      color: COLORS.primary,
      gradient: [COLORS.primary, COLORS.accent],
      onPress: () => navigation.navigate('AssignProjects'),
    },
    {
      id: 'admin-notifications',
      title: 'Client Responses',
      subtitle: 'Review uploaded media and feedback from clients',
      icon: 'folder-open',
      color: COLORS.secondary,
      gradient: [COLORS.secondary, COLORS.danger],
      onPress: () => navigation.navigate('AdminNotifications'),
    },
    {
      id: 'projects',
      title: 'All Projects',
      subtitle: 'View all projects and their current status',
      icon: 'analytics',
      color: COLORS.accent,
      gradient: [COLORS.accent, COLORS.primary],
      onPress: () => navigation.navigate('Projects'),
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
      icon: 'checkmark-done-circle'
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
});

export default AdminDashboardScreen; 