import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { authService } from '../services/authService';

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAuth = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (isForgotPassword) {
        // Handle forgot password
        if (!formData.email.trim()) {
          Alert.alert('Error', 'Please enter your email address');
          return;
        }
        await authService.forgotPassword(formData.email);
        Alert.alert('Success', 'Password reset email sent!');
        setIsForgotPassword(false);
      } else if (isLogin) {
        // Handle login - only email and password required
        if (!formData.email.trim() || !formData.password.trim()) {
          Alert.alert('Error', 'Please enter both email and password');
          return;
        }
        await authService.signIn(formData.email, formData.password);
        // Navigation will be handled by auth state listener
      } else {
        // Handle signup - only email, password, and confirmPassword required
        if (!formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
          Alert.alert('Error', 'Please enter email, password, and confirm password');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        // Use default values for optional fields if not provided
        const signupData = {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName.trim() || 'User',
          businessName: formData.businessName.trim() || 'Hello Habanero',
          phoneNumber: formData.phoneNumber.trim() || '',
        };
        await authService.signUp(signupData);
        // Navigation will be handled by auth state listener
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderForgotPassword = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsForgotPassword(false)}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.darkGray}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderAuthForm = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🌶️</Text>
          <Text style={styles.title}>Hello Habanero CRM</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name (optional)"
                  placeholderTextColor={COLORS.darkGray}
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="business" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Business Name (optional)"
                  placeholderTextColor={COLORS.darkGray}
                  value={formData.businessName}
                  onChangeText={(value) => handleInputChange('businessName', value)}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="call" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (optional)"
                  placeholderTextColor={COLORS.darkGray}
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.darkGray}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.darkGray}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={COLORS.darkGray}
              />
            </TouchableOpacity>
          </View>
          
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.darkGray}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showPassword}
              />
            </View>
          )}
          
          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => setIsForgotPassword(true)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchButton}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isForgotPassword ? renderForgotPassword() : renderAuthForm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  logo: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
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
  eyeButton: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  switchText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  switchButton: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AuthScreen; 