import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function MemberRegistration() {
  const [profileType, setProfileType] = useState('member'); // member, body, lawyer
  const [loading, setLoading] = useState(false);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Member fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Body fields
  const [bodyName, setBodyName] = useState('');
  const [bodyDescription, setBodyDescription] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');

  // Lawyer fields
  const [lawyerName, setLawyerName] = useState('');
  const [practiceAreas, setPracticeAreas] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [lawyerPhone, setLawyerPhone] = useState('');

  const handleRegister = async () => {
    // Validation
    if (!email || !password) {
      alert('Please fill in email and password');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    // Profile-specific validation
    if (profileType === 'member' && (!fullName || !phoneNumber)) {
      alert('Please fill in all member fields');
      return;
    }

    if (profileType === 'body' && (!bodyName || !bodyDescription)) {
      alert('Please fill in body name and description');
      return;
    }

    if (profileType === 'lawyer' && (!lawyerName || !practiceAreas)) {
      alert('Please fill in lawyer name and practice areas');
      return;
    }

    setLoading(true);

    // Step 1: Create authentication user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      alert('Registration failed: ' + authError.message);
      setLoading(false);
      return;
    }

    // Step 2: Save profile data based on type
    let profileError = null;

    if (profileType === 'member') {
      const { error } = await supabase.from('members').insert([
        {
          id: authData.user.id,
          full_name: fullName,
          email: email,
          phone_number: phoneNumber,
          user_type: 'member',
          points: 0,
        },
      ]);
      profileError = error;
    } else if (profileType === 'body') {
      const { error } = await supabase.from('bodies').insert([
        {
          user_id: authData.user.id,
          name: bodyName,
          description: bodyDescription,
          location: bodyLocation,
          points: 0,
          member_count: 0,
        },
      ]);
      profileError = error;
    } else if (profileType === 'lawyer') {
      const { error } = await supabase.from('lawyers').insert([
        {
          user_id: authData.user.id,
          full_name: lawyerName,
          email: email,
          phone_number: lawyerPhone,
          practice_areas: practiceAreas,
          license_number: licenseNumber,
          points: 0,
        },
      ]);
      profileError = error;
    }

    setLoading(false);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      alert('Profile creation failed: ' + profileError.message);
    } else {
      alert(`${profileType.charAt(0).toUpperCase() + profileType.slice(1)} registration successful! You can now login.`);
      
      // Clear all fields
      setEmail('');
      setPassword('');
      setFullName('');
      setPhoneNumber('');
      setBodyName('');
      setBodyDescription('');
      setBodyLocation('');
      setLawyerName('');
      setPracticeAreas('');
      setLicenseNumber('');
      setLawyerPhone('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create Account</Text>

      {/* Profile Type Selection */}
      <Text style={styles.label}>Select Profile Type</Text>
      <View style={styles.profileTypeContainer}>
        <TouchableOpacity
          style={[
            styles.profileTypeButton,
            profileType === 'member' && styles.profileTypeButtonActive,
          ]}
          onPress={() => setProfileType('member')}
        >
          <Text
            style={[
              styles.profileTypeText,
              profileType === 'member' && styles.profileTypeTextActive,
            ]}
          >
            👤 Member
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.profileTypeButton,
            profileType === 'body' && styles.profileTypeButtonActive,
          ]}
          onPress={() => setProfileType('body')}
        >
          <Text
            style={[
              styles.profileTypeText,
              profileType === 'body' && styles.profileTypeTextActive,
            ]}
          >
            🏢 Body/Org
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.profileTypeButton,
            profileType === 'lawyer' && styles.profileTypeButtonActive,
          ]}
          onPress={() => setProfileType('lawyer')}
        >
          <Text
            style={[
              styles.profileTypeText,
              profileType === 'lawyer' && styles.profileTypeTextActive,
            ]}
          >
            ⚖️ Lawyer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Common Fields */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />

      {/* Member-Specific Fields */}
      {profileType === 'member' && (
        <>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </>
      )}

      {/* Body-Specific Fields */}
      {profileType === 'body' && (
        <>
          <Text style={styles.label}>Organization Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter organization name"
            value={bodyName}
            onChangeText={setBodyName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your organization"
            value={bodyDescription}
            onChangeText={setBodyDescription}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Location (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter location"
            value={bodyLocation}
            onChangeText={setBodyLocation}
          />
        </>
      )}

      {/* Lawyer-Specific Fields */}
      {profileType === 'lawyer' && (
        <>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={lawyerName}
            onChangeText={setLawyerName}
          />

          <Text style={styles.label}>Practice Areas</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Corporate Law, Family Law"
            value={practiceAreas}
            onChangeText={setPracticeAreas}
          />

          <Text style={styles.label}>License Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter license number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
          />

          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={lawyerPhone}
            onChangeText={setLawyerPhone}
            keyboardType="phone-pad"
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.registerButtonText}>
          {loading ? 'Registering...' : 'Register'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#333',
  },
  profileTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  profileTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  profileTypeButtonActive: {
    backgroundColor: '#007bff',
  },
  profileTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  profileTypeTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  registerButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
