import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { COLORS } from './constants/colors';
import { authService } from './services/authService';

// Import screens
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import ClientDashboardScreen from './screens/ClientDashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import TasksScreen from './screens/TasksScreen';
import AdminNotificationsScreen from './screens/AdminNotificationsScreen';
import AssignProjectsScreen from './screens/AssignProjectsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userData = await authService.getUserData(user.uid);
          setUserRole(userData?.role || 'user');
        } catch (error) {
          console.error('Error loading user role:', error);
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Add a listener for role changes
  useEffect(() => {
    if (user) {
      const checkRoleChange = async () => {
        try {
          const userData = await authService.getUserData(user.uid);
          setUserRole(userData?.role || 'user');
        } catch (error) {
          console.error('Error checking role change:', error);
        }
      };

      // Check for role changes every 5 seconds
      const interval = setInterval(checkRoleChange, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={() => <></>} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // Authenticated stack
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={userRole === 'admin' ? AdminDashboardScreen : ClientDashboardScreen} 
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Projects" component={ProjectsScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
            <Stack.Screen name="AssignProjects" component={AssignProjectsScreen} />
          </>
        ) : (
          // Auth stack
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
