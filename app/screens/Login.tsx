import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

// CLAWS Brand Colors
const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  secondary: '#FF6B35',
  secondaryDark: '#E85A2A',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  white: '#FFFFFF',
  background: '#F8F9FA',
};

const Login = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      console.log('Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Social auth handlers (placeholder)
  const handleGoogleAuth = () => {
    Alert.alert('Coming Soon', 'Google authentication will be available soon');
  };

  const handleAppleAuth = () => {
    Alert.alert('Coming Soon', 'Apple authentication will be available soon');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* Flexible spacer at top */}
        <View style={styles.topSpacer} />

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Ionicons name="people" size={90} color={COLORS.primary} />
          <Ionicons 
            name="heart" 
            size={32} 
            color={COLORS.secondary} 
            style={styles.heartIcon}
          />
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to CLAWS</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to continue</Text>
        </View>

        {/* Social Auth Buttons */}
        <View style={styles.socialAuthContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleAuth}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={18} color="#DB4437" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.socialButtonApple]}
            onPress={handleAppleAuth}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-apple" size={18} color={COLORS.white} />
            <Text style={[styles.socialButtonText, styles.socialButtonTextApple]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </View>

        {/* OR Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email/Password Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="mail-outline" 
              size={18} 
              color={COLORS.mediumGray} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.mediumGray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="lock-closed-outline" 
              size={18} 
              color={COLORS.mediumGray} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={COLORS.mediumGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={COLORS.mediumGray}
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.signInButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms & Privacy */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>By signing in, you agree to our </Text>
          <TouchableOpacity onPress={() => Alert.alert('Terms of Service')}>
            <Text style={styles.termsLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> and </Text>
          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy')}>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('RoleSelection')}
        >
          <Text style={styles.registerLinkText}>
            Don't have an account? <Text style={styles.registerLinkBold}>Register</Text>
          </Text>
        </TouchableOpacity>

        {/* Flexible spacer at bottom */}
        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Flex spacers for balanced layout
  topSpacer: {
    flex: 1, // Takes available space at top
  },
  bottomSpacer: {
    flex: 1, // Takes available space at bottom
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  heartIcon: {
    position: 'absolute',
    top: -5,
    right: '35%',
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },

  // Social Auth
  socialAuthContainer: {
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 50,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonApple: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  socialButtonTextApple: {
    color: COLORS.white,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  // Form
  formContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  eyeIcon: {
    padding: 4,
  },

  // Sign In Button
  signInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  signInButtonDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Terms & Privacy
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 15,
  },
  termsText: {
    fontSize: 10,
    color: COLORS.mediumGray,
  },
  termsLink: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Register Link
  registerLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  registerLinkText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  registerLinkBold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default Login;
