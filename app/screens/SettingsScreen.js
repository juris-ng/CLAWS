import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ProfileService } from '../../utils/profileService';

export default function SettingsScreen({ user, profile, onBack, onLogout }) {
  const [notificationPrefs, setNotificationPrefs] = useState(
    profile?.notification_preferences || {
      petition_updates: true,
      comments: true,
      votes: true,
      messages: true,
      system: true,
    }
  );
  const [privacySettings, setPrivacySettings] = useState(
    profile?.privacy_settings || {
      show_email: false,
      show_phone: false,
      show_activity: true,
    }
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const handleNotificationToggle = async (key) => {
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    await ProfileService.updateNotificationPreferences(user.id, newPrefs);
  };

  const handlePrivacyToggle = async (key) => {
    const newSettings = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(newSettings);
    await ProfileService.updatePrivacySettings(user.id, newSettings);
  };

  const validatePassword = (password) => {
    // Password validation rules
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return null;
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    // Validate passwords match
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validationError = validatePassword(passwords.newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    // Change password
    const result = await ProfileService.changePassword(passwords.newPassword);

    if (result.success) {
      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: () => {
          setShowPasswordModal(false);
          setPasswords({ newPassword: '', confirmPassword: '' });
        }}
      ]);
    } else {
      setPasswordError(result.error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await ProfileService.deleteAccount(user.id);
            if (result.success) {
              Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
              onLogout();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Petition Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about updates on petitions you follow
              </Text>
            </View>
            <Switch
              value={notificationPrefs.petition_updates}
              onValueChange={() => handleNotificationToggle('petition_updates')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Comments</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone comments on your petitions
              </Text>
            </View>
            <Switch
              value={notificationPrefs.comments}
              onValueChange={() => handleNotificationToggle('comments')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Votes</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone votes on your petitions
              </Text>
            </View>
            <Switch
              value={notificationPrefs.votes}
              onValueChange={() => handleNotificationToggle('votes')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Messages</Text>
              <Text style={styles.settingDescription}>
                Get notified about new messages
              </Text>
            </View>
            <Switch
              value={notificationPrefs.messages}
              onValueChange={() => handleNotificationToggle('messages')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Email</Text>
              <Text style={styles.settingDescription}>
                Make your email visible to other users
              </Text>
            </View>
            <Switch
              value={privacySettings.show_email}
              onValueChange={() => handlePrivacyToggle('show_email')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Phone</Text>
              <Text style={styles.settingDescription}>
                Make your phone number visible to other users
              </Text>
            </View>
            <Switch
              value={privacySettings.show_phone}
              onValueChange={() => handlePrivacyToggle('show_phone')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Activity</Text>
              <Text style={styles.settingDescription}>
                Make your activity visible on your profile
              </Text>
            </View>
            <Switch
              value={privacySettings.show_activity}
              onValueChange={() => handlePrivacyToggle('show_activity')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Account</Text>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.actionLabel}>Change Password</Text>
            <Text style={styles.actionIcon}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={onLogout}>
            <Text style={styles.actionLabel}>Logout</Text>
            <Text style={styles.actionIcon}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, styles.dangerAction]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerLabel}>Delete Account</Text>
            <Text style={styles.actionIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Civic Engagement App</Text>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.passwordRequirements}>
                Password must contain:
                {'\n'}• At least 8 characters
                {'\n'}• One uppercase letter
                {'\n'}• One lowercase letter
                {'\n'}• One number
                {'\n'}• One special character (!@#$%^&*)
              </Text>

              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                value={passwords.newPassword}
                onChangeText={(text) => setPasswords(prev => ({ ...prev, newPassword: text }))}
                secureTextEntry
              />

              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                value={passwords.confirmPassword}
                onChangeText={(text) => setPasswords(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry
              />

              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.changePasswordButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
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
    fontSize: 24,
    color: '#0066FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#1C1C1E',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  actionLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  actionIcon: {
    fontSize: 20,
    color: '#8E8E93',
  },
  dangerAction: {
    backgroundColor: '#FFEBEE',
  },
  dangerLabel: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  appInfoText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 32,
    color: '#8E8E93',
  },
  modalBody: {
    padding: 20,
  },
  passwordRequirements: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 20,
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  passwordInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 12,
  },
  changePasswordButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  changePasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
