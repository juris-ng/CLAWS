import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { BodyService } from '../../utils/bodyService';

const BodySettingsScreen = ({ route, navigation }) => {
  const { signOut } = useAuth();
  const [bodyId, setBodyId] = useState(route.params?.bodyId);
  const [body, setBody] = useState(null);
  
  const [memberSettings, setMemberSettings] = useState({
    notify_petition_updates: true,
    notify_comments: true,
    notify_votes: true,
    notify_messages: true,
    show_email: false,
    show_phone: false,
    show_activity: true,
  });

  const [settings, setSettings] = useState({
    allow_messages: true,
    allow_petitions: true,
    auto_response_enabled: false,
    auto_response_message: '',
    notification_email: true,
    notification_push: true,
    visibility: 'public',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeBodyId();
  }, []);

  useEffect(() => {
    if (bodyId) {
      loadSettings();
    }
  }, [bodyId]);

  const initializeBodyId = async () => {
    if (!bodyId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setBodyId(user.id);
      }
    }
  };

  const loadSettings = async () => {
    try {
      const result = await BodyService.getBodyById(bodyId);
      if (result.success) {
        setBody(result.body);
        setSettings({
          allow_messages: result.body.allow_messages ?? true,
          allow_petitions: result.body.allow_petitions ?? true,
          auto_response_enabled: result.body.auto_response_enabled ?? false,
          auto_response_message: result.body.auto_response_message || '',
          notification_email: result.body.notification_email ?? true,
          notification_push: result.body.notification_push ?? true,
          visibility: result.body.visibility || 'public',
        });

        setMemberSettings({
          notify_petition_updates: result.body.notify_petition_updates ?? true,
          notify_comments: result.body.notify_comments ?? true,
          notify_votes: result.body.notify_votes ?? true,
          notify_messages: result.body.notify_messages ?? true,
          show_email: result.body.show_email ?? false,
          show_phone: result.body.show_phone ?? false,
          show_activity: result.body.show_activity ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const combinedSettings = {
        ...settings,
        ...memberSettings,
      };

      const result = await BodyService.updateBody(bodyId, combinedSettings);

      if (result.success) {
        Alert.alert('Success', 'Settings updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Organization',
      'This will hide your organization from public view. You can reactivate it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            const result = await BodyService.updateBody(bodyId, { is_active: false });
            if (result.success) {
              Alert.alert('Success', 'Organization deactivated successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Home' }],
                    });
                  },
                },
              ]);
            } else {
              Alert.alert('Error', 'Failed to deactivate organization');
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    const result = await BodyService.updateBody(bodyId, { is_active: true });
    if (result.success) {
      Alert.alert('Success', 'Organization reactivated successfully');
      loadSettings();
    } else {
      Alert.alert('Error', 'Failed to reactivate organization');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!body) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Ionicons name="settings-outline" size={64} color="#BDBDBD" />
          <Text style={styles.errorText}>Settings not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ✅ Clean Header - No Orange */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#202124" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>{body?.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ✅ Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color="#5F6368" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Petition Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about updates on petitions you follow
              </Text>
            </View>
            <Switch
              value={memberSettings.notify_petition_updates}
              onValueChange={(value) =>
                setMemberSettings({ ...memberSettings, notify_petition_updates: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={memberSettings.notify_petition_updates ? '#1A73E8' : '#F5F5F5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Comments</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone comments on your petitions
              </Text>
            </View>
            <Switch
              value={memberSettings.notify_comments}
              onValueChange={(value) =>
                setMemberSettings({ ...memberSettings, notify_comments: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={memberSettings.notify_comments ? '#1A73E8' : '#F5F5F5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Votes</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone votes on your petitions
              </Text>
            </View>
            <Switch
              value={memberSettings.notify_votes}
              onValueChange={(value) =>
                setMemberSettings({ ...memberSettings, notify_votes: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={memberSettings.notify_votes ? '#1A73E8' : '#F5F5F5'}
            />
          </View>

          <View style={[styles.settingRow, styles.lastRow]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Messages</Text>
              <Text style={styles.settingDescription}>Get notified about new messages</Text>
            </View>
            <Switch
              value={memberSettings.notify_messages}
              onValueChange={(value) =>
                setMemberSettings({ ...memberSettings, notify_messages: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={memberSettings.notify_messages ? '#1A73E8' : '#F5F5F5'}
            />
          </View>
        </View>

        {/* ✅ Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#5F6368" />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Email</Text>
              <Text style={styles.settingDescription}>Make your email visible to other users</Text>
            </View>
            <Switch
              value={memberSettings.show_email}
              onValueChange={(value) =>
                setMemberSettings({ ...memberSettings, show_email: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={memberSettings.show_email ? '#1A73E8' : '#F5F5F5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Phone</Text>
              <Text style={styles.settingDescription}>
                Make your phone number visible to other users
              </Text>
            </View>
            <Switch
              value={memberSettings.show_phone}
              onValueChange={(value) =>
                setMemberSettings({ ...memberSettings, show_phone: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={memberSettings.show_phone ? '#1A73E8' : '#F5F5F5'}
            />
          </View>

          <View style={[styles.settingRow, styles.lastRow]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Activity</Text>
              <Text style={styles.settingDescription}>
                Make your activity visible on your profile
              </Text>
            </View>
            <Switch
              value={memberSettings.show_activity}
              onValueChange={(value) =>
                setMemberSettings({ ...memberSettings, show_activity: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={memberSettings.show_activity ? '#1A73E8' : '#F5F5F5'}
            />
          </View>
        </View>

        {/* ✅ Communication Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color="#5F6368" />
            <Text style={styles.sectionTitle}>Communication</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Messages</Text>
              <Text style={styles.settingDescription}>Members can send direct messages</Text>
            </View>
            <Switch
              value={settings.allow_messages}
              onValueChange={(value) => setSettings({ ...settings, allow_messages: value })}
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={settings.allow_messages ? '#1A73E8' : '#F5F5F5'}
            />
          </View>

          <View style={[styles.settingRow, styles.lastRow]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Petitions</Text>
              <Text style={styles.settingDescription}>
                Members can create petitions directed at your organization
              </Text>
            </View>
            <Switch
              value={settings.allow_petitions}
              onValueChange={(value) => setSettings({ ...settings, allow_petitions: value })}
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={settings.allow_petitions ? '#1A73E8' : '#F5F5F5'}
            />
          </View>
        </View>

        {/* ✅ Auto-Response Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="paper-plane-outline" size={20} color="#5F6368" />
            <Text style={styles.sectionTitle}>Auto-Response</Text>
          </View>

          <View style={[styles.settingRow, !settings.auto_response_enabled && styles.lastRow]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Auto-Response</Text>
              <Text style={styles.settingDescription}>Automatically respond to new messages</Text>
            </View>
            <Switch
              value={settings.auto_response_enabled}
              onValueChange={(value) =>
                setSettings({ ...settings, auto_response_enabled: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={settings.auto_response_enabled ? '#1A73E8' : '#F5F5F5'}
            />
          </View>

          {settings.auto_response_enabled && (
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>Auto-Response Message</Text>
              <TextInput
                style={styles.textArea}
                value={settings.auto_response_message}
                onChangeText={(text) =>
                  setSettings({ ...settings, auto_response_message: text })
                }
                placeholder="Thank you for your message. We will respond within 24 hours..."
                placeholderTextColor="#9E9E9E"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{settings.auto_response_message.length}/500</Text>
            </View>
          )}
        </View>

        {/* ✅ Profile Visibility */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={20} color="#5F6368" />
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
          </View>

          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                settings.visibility === 'public' && styles.visibilityOptionActive,
              ]}
              onPress={() => setSettings({ ...settings, visibility: 'public' })}
            >
              <Ionicons 
                name="globe-outline" 
                size={28} 
                color={settings.visibility === 'public' ? '#1A73E8' : '#757575'} 
              />
              <Text
                style={[
                  styles.visibilityLabel,
                  settings.visibility === 'public' && styles.visibilityLabelActive,
                ]}
              >
                Public
              </Text>
              <Text style={styles.visibilityDescription}>Visible to everyone</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.visibilityOption,
                settings.visibility === 'unlisted' && styles.visibilityOptionActive,
              ]}
              onPress={() => setSettings({ ...settings, visibility: 'unlisted' })}
            >
              <Ionicons 
                name="link-outline" 
                size={28} 
                color={settings.visibility === 'unlisted' ? '#1A73E8' : '#757575'} 
              />
              <Text
                style={[
                  styles.visibilityLabel,
                  settings.visibility === 'unlisted' && styles.visibilityLabelActive,
                ]}
              >
                Unlisted
              </Text>
              <Text style={styles.visibilityDescription}>Only via direct link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#5F6368" />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#5F6368" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>Logout</Text>
              <Text style={styles.actionButtonSubtext}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* ✅ Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color="#E53935" />
            <Text style={[styles.sectionTitle, { color: '#E53935' }]}>Danger Zone</Text>
          </View>

          {body.is_active ? (
            <TouchableOpacity style={styles.dangerButton} onPress={handleDeactivate}>
              <Ionicons name="close-circle-outline" size={20} color="#E53935" />
              <View style={styles.actionButtonContent}>
                <Text style={styles.dangerButtonText}>Deactivate Organization</Text>
                <Text style={styles.dangerButtonSubtext}>
                  Hide your organization from public view
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#E53935" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.successButton} onPress={handleReactivate}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" />
              <View style={styles.actionButtonContent}>
                <Text style={styles.successButtonText}>Reactivate Organization</Text>
                <Text style={styles.successButtonSubtext}>
                  Make your organization public again
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#2E7D32" />
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5F6368',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#5F6368',
    marginTop: 16,
  },
  // ✅ Clean Header (No Orange)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#5F6368',
    lineHeight: 18,
  },
  textAreaContainer: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#202124',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginTop: 4,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
  },
  visibilityOption: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  visibilityOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1A73E8',
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    marginTop: 8,
    marginBottom: 4,
  },
  visibilityLabelActive: {
    color: '#1A73E8',
  },
  visibilityDescription: {
    fontSize: 12,
    color: '#5F6368',
    textAlign: 'center',
  },
  // ✅ Minimalist Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 16,
  },
  actionButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 2,
  },
  actionButtonSubtext: {
    fontSize: 13,
    color: '#5F6368',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 16,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E53935',
    marginBottom: 2,
  },
  dangerButtonSubtext: {
    fontSize: 13,
    color: '#EF5350',
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 16,
  },
  successButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2E7D32',
    marginBottom: 2,
  },
  successButtonSubtext: {
    fontSize: 13,
    color: '#66BB6A',
  },
  // ✅ Clean Save Button
  saveButton: {
    backgroundColor: '#1A73E8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    height: 40,
  },
});

export default BodySettingsScreen;
