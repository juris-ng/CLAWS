import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { ResponsiveUtils } from '../../utils/responsive';
import AdvancedSettingsScreen from './AdvancedSettingsScreen';

export default function ProfileScreen({ user, profile: initialProfile, onBack, onLogout, onViewFollowers, onViewFollowing }) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Your existing states and functions...
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [location, setLocation] = useState(profile?.location || '');

  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .update({
        full_name: fullName,
        bio: bio,
        phone_number: phoneNumber,
        location: location,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      setProfile(data);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  // Show Advanced Settings Screen
  if (showAdvancedSettings) {
    return (
      <AdvancedSettingsScreen
        user={user}
        profile={profile}
        onBack={() => setShowAdvancedSettings(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editButton}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          {!editing && (
            <Text style={styles.userName}>{profile?.full_name}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={onViewFollowers}>
            <Text style={styles.statValue}>{profile?.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.total_points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <TouchableOpacity style={styles.statBox} onPress={onViewFollowing}>
            <Text style={styles.statValue}>{profile?.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={fullName}
              onChangeText={setFullName}
              editable={editing}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textArea, !editing && styles.inputDisabled]}
              value={bio}
              onChangeText={setBio}
              editable={editing}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={editing}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={location}
              onChangeText={setLocation}
              editable={editing}
              placeholder="Enter your location"
            />
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings & Actions</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => setShowAdvancedSettings(true)}
          >
            <Text style={styles.settingButtonText}>⚙️ Advanced Settings</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => Alert.alert('Help & Support', 'Coming soon!')}
          >
            <Text style={styles.settingButtonText}>❓ Help & Support</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => Alert.alert('About', 'Civic Engagement Platform v1.0.0')}
          >
            <Text style={styles.settingButtonText}>ℹ️ About</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.settingButtonText, styles.logoutButtonText]}>
              🚪 Logout
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingTop: ResponsiveUtils.isIPhoneX() ? 44 : 20,
    paddingBottom: ResponsiveUtils.spacing(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
  },
  backIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    color: '#1C1C1E',
  },
  headerTitle: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  editButton: {
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#0066FF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(3),
    backgroundColor: '#FFFFFF',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  avatarLargeText: {
    fontSize: ResponsiveUtils.fontSize(40),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: ResponsiveUtils.fontSize(22),
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: ResponsiveUtils.spacing(2),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  sectionTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(2),
    color: '#1C1C1E',
  },
  inputGroup: {
    marginBottom: ResponsiveUtils.spacing(2),
  },
  inputLabel: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(0.75),
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: ResponsiveUtils.spacing(1.5),
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#1C1C1E',
  },
  textArea: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: ResponsiveUtils.spacing(1.5),
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#1C1C1E',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#0066FF',
    padding: ResponsiveUtils.spacing(1.75),
    borderRadius: 10,
    alignItems: 'center',
    marginTop: ResponsiveUtils.spacing(1),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ResponsiveUtils.spacing(1.75),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#1C1C1E',
  },
  settingButtonArrow: {
    fontSize: ResponsiveUtils.fontSize(18),
    color: '#8E8E93',
  },
  logoutButton: {
    borderBottomWidth: 0,
    marginTop: ResponsiveUtils.spacing(2),
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});
