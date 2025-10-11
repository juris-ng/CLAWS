import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../supabase';
import { NetworkMonitor } from '../../utils/networkMonitor';
import { OfflineCache } from '../../utils/offlineCache';
import { PushNotificationService } from '../../utils/pushNotificationService';
import { ResponsiveUtils } from '../../utils/responsive';

export default function AdvancedSettingsScreen({ user, profile, onBack }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ isConnected: true, type: 'unknown' });
  const [cacheSize, setCacheSize] = useState('Unknown');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    loadSettings();
    checkNetworkStatus();
    checkCacheInfo();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await OfflineCache.getSettings();
    setSettings(savedSettings);
  };

  const checkNetworkStatus = async () => {
    const status = await NetworkMonitor.checkConnection();
    setNetworkStatus(status);
  };

  const checkCacheInfo = async () => {
    const lastSync = await OfflineCache.getLastSyncTime();
    setLastSyncTime(lastSync);
  };

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    await OfflineCache.saveSettings(newSettings);

    // Update database
    const { error } = await supabase
      .from('members')
      .update({
        notification_preferences: newSettings.notifications,
        privacy_settings: newSettings.privacy,
        theme: newSettings.theme,
        language: newSettings.language,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Update settings error:', error);
    }
  };

  const toggleNotification = (key) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    updateSettings(newSettings);
  };

  const togglePrivacy = (key) => {
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key],
      },
    };
    updateSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await OfflineCache.clearCache();
            setCacheSize('0 KB');
            setLastSyncTime(null);
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleEnablePushNotifications = async () => {
    setLoading(true);
    const token = await PushNotificationService.registerForPushNotifications();
    
    if (token) {
      await PushNotificationService.savePushToken(user.id, token);
      Alert.alert('Success! 🔔', 'Push notifications enabled successfully');
    } else {
      Alert.alert('Error', 'Failed to enable push notifications. Make sure you granted permission.');
    }
    
    setLoading(false);
  };

  const handleTestNotification = async () => {
    await PushNotificationService.scheduleNotification(
      'Test Notification',
      'This is a test notification from your civic engagement app!',
      { test: true },
      3
    );
    Alert.alert('Notification Scheduled', 'You will receive a test notification in 3 seconds');
  };

  const handleSyncNow = async () => {
    if (!networkStatus.isConnected) {
      Alert.alert('No Internet', 'Cannot sync while offline');
      return;
    }

    Alert.alert('Sync Started', 'Syncing data...');
    // Add your sync logic here
    await OfflineCache.saveToCache('@last_sync_time', new Date().toISOString());
    setLastSyncTime(new Date().toISOString());
    Alert.alert('Success', 'Data synced successfully');
  };

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
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
        <Text style={styles.headerTitle}>Advanced Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Account Information</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(profile?.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user.id}</Text>
          </View>
        </View>

        {/* Network Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Network Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Connection</Text>
              <View style={[styles.statusBadge, networkStatus.isConnected ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                <Text style={styles.statusBadgeText}>
                  {networkStatus.isConnected ? '✓ Online' : '✗ Offline'}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Connection Type</Text>
              <Text style={styles.statusValue}>{networkStatus.type?.toUpperCase() || 'Unknown'}</Text>
            </View>
          </View>
        </View>

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Push Notifications</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEnablePushNotifications}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Enabling...' : '🔔 Enable Push Notifications'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleTestNotification}
          >
            <Text style={styles.secondaryButtonText}>🧪 Test Notification</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Petition Updates</Text>
              <Text style={styles.settingDescription}>Get notified about petition activity</Text>
            </View>
            <Switch
              value={settings.notifications.petition_updates}
              onValueChange={() => toggleNotification('petition_updates')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Comments</Text>
              <Text style={styles.settingDescription}>New comments on your petitions</Text>
            </View>
            <Switch
              value={settings.notifications.comments}
              onValueChange={() => toggleNotification('comments')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Votes</Text>
              <Text style={styles.settingDescription}>When someone votes on your petition</Text>
            </View>
            <Switch
              value={settings.notifications.votes}
              onValueChange={() => toggleNotification('votes')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Messages</Text>
              <Text style={styles.settingDescription}>Direct messages and mentions</Text>
            </View>
            <Switch
              value={settings.notifications.messages}
              onValueChange={() => toggleNotification('messages')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>System Notifications</Text>
              <Text style={styles.settingDescription}>Important app updates</Text>
            </View>
            <Switch
              value={settings.notifications.system}
              onValueChange={() => toggleNotification('system')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Email</Text>
              <Text style={styles.settingDescription}>Visible on your public profile</Text>
            </View>
            <Switch
              value={settings.privacy.show_email}
              onValueChange={() => togglePrivacy('show_email')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Phone</Text>
              <Text style={styles.settingDescription}>Visible on your public profile</Text>
            </View>
            <Switch
              value={settings.privacy.show_phone}
              onValueChange={() => togglePrivacy('show_phone')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Activity</Text>
              <Text style={styles.settingDescription}>Others can see your contributions</Text>
            </View>
            <Switch
              value={settings.privacy.show_activity}
              onValueChange={() => togglePrivacy('show_activity')}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Data & Storage</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Cache Size</Text>
            <Text style={styles.infoValue}>{cacheSize}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Last Sync</Text>
            <Text style={styles.infoValue}>
              {lastSyncTime 
                ? new Date(lastSyncTime).toLocaleString()
                : 'Never synced'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSyncNow}
          >
            <Text style={styles.primaryButtonText}>🔄 Sync Now</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleClearCache}
          >
            <Text style={styles.dangerButtonText}>🗑️ Clear Cache</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>App Name</Text>
            <Text style={styles.infoValue}>Civic Engagement Platform</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>1</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Expo / React Native</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: ResponsiveUtils.fontSize(16),
    color: '#8E8E93',
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
  scrollView: {
    flex: 1,
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
  infoCard: {
    backgroundColor: '#F2F2F7',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 8,
    marginBottom: ResponsiveUtils.spacing(1),
  },
  infoLabel: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#1C1C1E',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#F2F2F7',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(1),
  },
  statusLabel: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#3C3C43',
  },
  statusValue: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#0066FF',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: ResponsiveUtils.spacing(1.5),
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeOnline: {
    backgroundColor: '#34C759',
  },
  statusBadgeOffline: {
    backgroundColor: '#FF3B30',
  },
  statusBadgeText: {
    fontSize: ResponsiveUtils.fontSize(12),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flex: 1,
    marginRight: ResponsiveUtils.spacing(2),
  },
  settingLabel: {
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: ResponsiveUtils.spacing(2),
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    padding: ResponsiveUtils.spacing(1.75),
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    padding: ResponsiveUtils.spacing(1.75),
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  secondaryButtonText: {
    color: '#0066FF',
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    padding: ResponsiveUtils.spacing(1.75),
    borderRadius: 10,
    alignItems: 'center',
    marginTop: ResponsiveUtils.spacing(1),
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
  },
});
