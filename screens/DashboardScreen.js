import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { auth } from '../firebase';

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    ongoingProjects: 0,
    pendingTasks: 0,
    clientResponses: 0,
    completed: 0
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userData = await authService.getUserData(currentUser.uid);
        setUser(userData);
        
        // Load stats
        const [ongoingProjects, pendingTasks, allTasks] = await Promise.all([
          projectService.getOngoingProjects(currentUser.uid),
          taskService.getPendingTasks(currentUser.uid),
          taskService.getAllTasks()
        ]);
        
        const resolvedTasks = allTasks.filter(task => task.status === 'resolved');
        const completedTasks = allTasks.filter(task => task.status === 'completed');
        
        setStats({
          ongoingProjects: ongoingProjects.length,
          pendingTasks: pendingTasks.length,
          clientResponses: resolvedTasks.length,
          completed: completedTasks.length
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const menuItems = [
    {
      id: 'projects',
      title: 'Ongoing Projects',
      subtitle: 'View and manage your active projects',
      icon: 'folder-open',
      color: COLORS.primary,
      onPress: () => navigation.navigate('Projects'),
    },
    {
      id: 'tasks',
      title: 'Pending Tasks',
      subtitle: 'Complete assigned tasks and upload content',
      icon: 'checkmark-circle',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('Tasks'),
    },
    {
      id: 'admin-notifications',
      title: 'Admin Notifications',
      subtitle: 'Review client responses and complete tasks',
      icon: 'notifications',
      color: COLORS.danger,
      onPress: () => navigation.navigate('AdminNotifications'),
    },
  ];

  const quickStats = [
    { 
      label: 'Ongoing Projects', 
      value: stats.ongoingProjects.toString(), 
      icon: 'folder-open',
      onPress: () => navigation.navigate('Projects')
    },
    { 
      label: 'Pending Tasks', 
      value: stats.pendingTasks.toString(), 
      icon: 'checkmark-circle',
      onPress: () => navigation.navigate('Tasks')
    },
    { 
      label: 'Client Responses', 
      value: stats.clientResponses.toString(), 
      icon: 'notifications',
      onPress: () => navigation.navigate('AdminNotifications')
    },
    { 
      label: 'Completed', 
      value: stats.completed.toString(), 
      icon: 'checkmark-done-circle'
    },
  ];

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
                Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! 👋
              </Text>
              <Text style={styles.subtitle}>
                {user?.businessName || 'Hello Habanero CRM'}
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
              <Text style={styles.sectionTitle}>Quick Overview</Text>
              <View style={styles.statsGrid}>
                {quickStats.map((stat, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.statCard}
                    onPress={stat.onPress}
                    disabled={!stat.onPress}
                  >
                    <View style={styles.statIcon}>
                      <Ionicons name={stat.icon} size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Main Menu */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>What would you like to do?</Text>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={24} color={COLORS.white} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
                </TouchableOpacity>
              ))}
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
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
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
    paddingTop: 20,
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
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Optionally add backdropFilter for web
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  activitySection: {
    marginBottom: 30,
  },
  activityCard: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
});

export default DashboardScreen; 