import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';
import TabNavigator from '../navigation/TabNavigator';
import OnboardingScreen from './OnboardingScreen';

export default function AuthScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false); // Change to true to show onboarding first
  
  // Registration/Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  
  // Body-specific fields
  const [bodyName, setBodyName] = useState('');
  const [bodyDescription, setBodyDescription] = useState('');
  
  // Lawyer-specific fields
  const [practiceAreas, setPracticeAreas] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await loadUserProfile(session.user);
    }
    setLoading(false);
  };

  const loadUserProfile = async (currentUser) => {
    // Check members table
    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (memberData) {
      setProfile({ ...memberData, type: 'member' });
      setLoading(false);
      return;
    }

    // Check bodies table
    const { data: bodyData } = await supabase
      .from('bodies')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (bodyData) {
      setProfile({ ...bodyData, type: 'body' });
      setLoading(false);
      return;
    }

    // Check lawyers table
    const { data: lawyerData } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (lawyerData) {
      setProfile({ ...lawyerData, type: 'lawyer' });
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    setLoading(false);

    if (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    if (selectedRole === 'member' && (!fullName || !phoneNumber)) {
      alert('Please enter full name and phone number');
      return;
    }

    if (selectedRole === 'body' && !bodyName) {
      alert('Please enter organization name');
      return;
    }

    if (selectedRole === 'lawyer' && (!fullName || !practiceAreas)) {
      alert('Please enter full name and practice areas');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setLoading(false);
      alert('Registration failed: ' + error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      alert('Registration failed');
      return;
    }

    // Create profile based on role
    let profileError = null;

    if (selectedRole === 'member') {
      const { error } = await supabase.from('members').insert([
        {
          id: data.user.id,
          email: email.trim(),
          full_name: fullName,
          phone_number: phoneNumber,
          points: 0,
        },
      ]);
      profileError = error;
    } else if (selectedRole === 'body') {
      const { error } = await supabase.from('bodies').insert([
        {
          user_id: data.user.id,
          name: bodyName,
          description: bodyDescription,
          email: email.trim(),
          points: 0,
          member_count: 0,
        },
      ]);
      profileError = error;
    } else if (selectedRole === 'lawyer') {
      const { error } = await supabase.from('lawyers').insert([
        {
          user_id: data.user.id,
          full_name: fullName,
          email: email.trim(),
          practice_areas: practiceAreas,
          license_number: licenseNumber,
          points: 0,
        },
      ]);
      profileError = error;
    }

    setLoading(false);

    if (profileError) {
      alert('Profile creation failed: ' + profileError.message);
    } else {
      alert('Registration successful! Please login.');
      setIsLogin(true);
      setEmail('');
      setPassword('');
    }
  };

  // Show onboarding for new users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  // Show tabs if user is logged in
  if (user && profile) {
    return <TabNavigator userType={profile.type} user={user} profile={profile} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.logo}>MAU2</Text>
        <Text style={styles.tagline}>Mwananchi Action Unite</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Toggle Login/Register */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* Role Selection (Register only) */}
        {!isLogin && (
          <View style={styles.roleContainer}>
            <Text style={styles.label}>I am joining as...</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'member' && styles.roleButtonActive]}
                onPress={() => setSelectedRole('member')}
              >
                <Text style={styles.roleIcon}>👤</Text>
                <Text style={styles.roleTitle}>Member</Text>
                <Text style={styles.roleSubtitle}>Support petitions, engage with bodies.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'body' && styles.roleButtonActive]}
                onPress={() => setSelectedRole('body')}
              >
                <Text style={styles.roleIcon}>🏢</Text>
                <Text style={styles.roleTitle}>Body</Text>
                <Text style={styles.roleSubtitle}>Govern, create, and manage initiatives.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'lawyer' && styles.roleButtonActive]}
                onPress={() => setSelectedRole('lawyer')}
              >
                <Text style={styles.roleIcon}>⚖️</Text>
                <Text style={styles.roleTitle}>Lawyer</Text>
                <Text style={styles.roleSubtitle}>Provide legal aid, verify petitions.</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Email */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Registration Fields */}
        {!isLogin && selectedRole === 'member' && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </>
        )}

        {!isLogin && selectedRole === 'body' && (
          <>
            <Text style={styles.label}>Organization Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter organization name"
              value={bodyName}
              onChangeText={setBodyName}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your organization"
              value={bodyDescription}
              onChangeText={setBodyDescription}
              multiline
            />
          </>
        )}

        {!isLogin && selectedRole === 'lawyer' && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Practice Areas</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Constitutional Law, Human Rights"
              value={practiceAreas}
              onChangeText={setPracticeAreas}
            />

            <Text style={styles.label}>License Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your license number"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
          </>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={isLogin ? handleLogin : handleRegister}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0066FF',
    padding: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  formContainer: {
    padding: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#0066FF',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleButtons: {
    gap: 10,
  },
  roleButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  roleButtonActive: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
