import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { authService } from '../services/authService';
import { auth } from '../firebase';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userData = await authService.getUserData(currentUser.uid);
        setUser(userData);
        setFormData({
          fullName: userData.fullName || '',
          businessName: userData.businessName || '',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    try {
      setUpdating(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const downloadURL = await authService.uploadProfilePicture(currentUser.uid, imageUri);
        setUser(prev => ({ ...prev, profilePicture: downloadURL }));
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.fullName.trim() || !formData.businessName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setUpdating(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await authService.updateProfile(currentUser.uid, {
          fullName: formData.fullName.trim(),
          businessName: formData.businessName.trim(),
        });
        
        setUser(prev => ({
          ...prev,
          fullName: formData.fullName.trim(),
          businessName: formData.businessName.trim(),
        }));
        
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };



  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              // Navigation will be handled by the auth state listener
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Picture Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={pickImage}
                disabled={updating}
              >
                {user?.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={40} color={COLORS.white} />
                  </View>
                )}
                <View style={styles.editIconContainer}>
                  <Ionicons name="camera" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              
              {updating && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                </View>
              )}
              
              <Text style={styles.profileName}>{user?.fullName}</Text>
              <Text style={styles.profileBusiness}>{user?.businessName}</Text>
              <Text style={styles.profileRole}>Role: {user?.role || 'user'}</Text>
            </View>



            {/* Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.darkGray}
                  value={formData.fullName}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, fullName: value }))}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="business" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Business Name"
                  placeholderTextColor={COLORS.darkGray}
                  value={formData.businessName}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, businessName: value }))}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.updateButton, updating && styles.buttonDisabled]}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                <Text style={styles.updateButtonText}>
                  {updating ? 'Updating...' : 'Update Profile'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={COLORS.darkGray} />
                <Text style={styles.infoText}>{user?.email}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={COLORS.darkGray} />
                <Text style={styles.infoText}>{user?.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="shield" size={20} color={COLORS.darkGray} />
                <Text style={styles.infoText}>
                  Role: {user?.role === 'admin' ? 'Administrator' : 'User'}
                </Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 5,
  },
  profileBusiness: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  profileRole: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 5,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 10,
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 30,
  },
  signOutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProfileScreen; 