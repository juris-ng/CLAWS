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

export default function MemberRegistration({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (!fullName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create authentication user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Step 2: Create member profile
      const { error: profileError } = await supabase.from('members').insert([
        {
          id: authData.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          user_type: 'member',
          points: 0,
        },
      ]);

      if (profileError) throw profileError;

      Alert.alert(
        'Success',
        'Member registration successful! Please check your email to verify your account, then log in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Registration failed');
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
        {/* Reduced spacer at top - flex: 0.5 */}
        <View style={styles.topSpacer} />

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Ionicons name="person-add" size={80} color={COLORS.primary} />
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={COLORS.secondary}
            style={styles.checkIcon}
          />
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to CLAWS</Text>
          <Text style={styles.welcomeSubtitle}>Let's create your account</Text>
        </View>

        {/* Social Auth Buttons */}
        <View style={styles.socialAuthContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleAuth}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={16} color="#DB4437" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.socialButtonApple]}
            onPress={handleAppleAuth}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-apple" size={16} color={COLORS.white} />
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

        {/* Registration Form */}
        <View style={styles.formContainer}>
          {/* Full Name Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={16}
              color={COLORS.mediumGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={COLORS.mediumGray}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={16}
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

          {/* Password Input - Updated placeholder to 8 characters */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
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
                size={16}
                color={COLORS.mediumGray}
              />
            </TouchableOpacity>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.signUpButtonText}>Sign up</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms & Privacy */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>By signing up, you agree to our </Text>
          <TouchableOpacity onPress={() => Alert.alert('Terms of Service')}>
            <Text style={styles.termsLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> and </Text>
          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy')}>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>
          </Text>
        </TouchableOpacity>

        {/* Reduced spacer at bottom - flex: 0.5 */}
        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
}

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

  // REDUCED flex spacers - 0.5 instead of 1 for tighter spacing
  topSpacer: {
    flex: 0.5, // ✅ Reduced from 1
  },
  bottomSpacer: {
    flex: 0.5, // ✅ Reduced from 1
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    top: -5,
    right: '36%',
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },

  // Social Auth
  socialAuthContainer: {
    marginBottom: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 50,
    paddingVertical: 10,
    marginBottom: 8,
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
    marginLeft: 8,
    fontSize: 13,
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
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  // Form
  formContainer: {
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.darkGray,
  },
  eyeIcon: {
    padding: 4,
  },

  // Sign Up Button
  signUpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  signUpButtonDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  signUpButtonText: {
    fontSize: 14,
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
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  termsText: {
    fontSize: 9,
    color: COLORS.mediumGray,
  },
  termsLink: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Login Link
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
