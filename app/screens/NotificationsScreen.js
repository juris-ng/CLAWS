import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { NOTIFICATION_TYPES, NotificationService } from '../../utils/notificationService';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await NotificationService.getUserNotifications(user.id, {
        limit: 100,
        unreadOnly: activeTab === 'unread',
        type: selectedType,
      });

      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;

    const result = await NotificationService.getUnreadCount(user.id);
    if (result.success) {
      setUnreadCount(result.count);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    loadUnreadCount();
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await NotificationService.markAsRead(notification.id);
      loadNotifications();
      loadUnreadCount();
    }

    // Navigate based on type
    switch (notification.reference_type) {
      case 'petition':
        navigation.navigate('PetitionDetail', { petitionId: notification.reference_id });
        break;
      case 'case':
        navigation.navigate('CaseDetail', { caseId: notification.reference_id });
        break;
      case 'conversation':
        navigation.navigate('ConversationDetail', {
          conversationId: notification.reference_id,
        });
        break;
      default:
        break;
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await NotificationService.markAsRead(notificationId);
    loadNotifications();
    loadUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            await NotificationService.markAllAsRead(user.id);
            loadNotifications();
            loadUnreadCount();
          },
        },
      ]
    );
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert('Delete Notification', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await NotificationService.deleteNotification(notificationId);
          loadNotifications();
          loadUnreadCount();
        },
      },
    ]);
  };

  const handleClearAll = async () => {
    Alert.alert('Clear Notifications', 'Delete all read notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await NotificationService.clearReadNotifications(user.id);
          loadNotifications();
        },
      },
    ]);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      [NOTIFICATION_TYPES.PETITION_SIGNED]: '✍️',
      [NOTIFICATION_TYPES.PETITION_MILESTONE]: '🎯',
      [NOTIFICATION_TYPES.PETITION_UPDATE]: '📝',
      [NOTIFICATION_TYPES.PETITION_SUCCESS]: '🎉',
      [NOTIFICATION_TYPES.PETITION_COMMENT]: '💬',
      [NOTIFICATION_TYPES.NEW_FOLLOWER]: '👤',
      [NOTIFICATION_TYPES.LEVEL_UP]: '⬆️',
      [NOTIFICATION_TYPES.BADGE_EARNED]: '🏆',
      [NOTIFICATION_TYPES.CASE_UPDATE]: '⚖️',
      [NOTIFICATION_TYPES.CONSULTATION_BOOKED]: '📅',
      [NOTIFICATION_TYPES.NEW_MESSAGE]: '✉️',
      [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: '📢',
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      [NOTIFICATION_TYPES.PETITION_MILESTONE]: '#4CAF50',
      [NOTIFICATION_TYPES.PETITION_SUCCESS]: '#2196F3',
      [NOTIFICATION_TYPES.LEVEL_UP]: '#FF9800',
      [NOTIFICATION_TYPES.BADGE_EARNED]: '#FFC107',
      [NOTIFICATION_TYPES.CASE_UPDATE]: '#9C27B0',
      [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: '#F44336',
    };
    return colors[type] || '#E3F2FD';
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unread]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => {
        Alert.alert('Options', 'Choose an action', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: item.is_read ? 'Mark as Unread' : 'Mark as Read',
            onPress: () => handleMarkAsRead(item.id),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDeleteNotification(item.id),
          },
        ]);
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.notification_type) },
        ]}
      >
        <Text style={styles.icon}>{getNotificationIcon(item.notification_type)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {item.priority === 'urgent' && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>!</Text>
            </View>
          )}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{getTimeAgo(item.created_at)}</Text>
      </View>

      <View style={styles.rightSection}>
        {!item.is_read && <View style={styles.unreadDot} />}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteNotification(item.id);
          }}
        >
          <Text style={styles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      {/* Stats Card */}
      {unreadCount > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsText}>
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.statsButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.statsButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Type Filters */}
      <View style={styles.typeFiltersContainer}>
        <Text style={styles.typeFiltersTitle}>Filter by Type:</Text>
        <View style={styles.typeFiltersList}>
          <TouchableOpacity
            style={[
              styles.typeFilterChip,
              !selectedType && styles.typeFilterChipActive,
            ]}
            onPress={() => {
              setSelectedType(null);
              loadNotifications();
            }}
          >
            <Text
              style={[
                styles.typeFilterText,
                !selectedType && styles.typeFilterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {[
            { type: NOTIFICATION_TYPES.PETITION_UPDATE, label: '📝 Petitions', icon: '📝' },
            { type: NOTIFICATION_TYPES.BADGE_EARNED, label: '🏆 Badges', icon: '🏆' },
            { type: NOTIFICATION_TYPES.NEW_MESSAGE, label: '✉️ Messages', icon: '✉️' },
            { type: NOTIFICATION_TYPES.CASE_UPDATE, label: '⚖️ Cases', icon: '⚖️' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.type}
              style={[
                styles.typeFilterChip,
                selectedType === filter.type && styles.typeFilterChipActive,
              ]}
              onPress={() => {
                setSelectedType(filter.type);
                loadNotifications();
              }}
            >
              <Text
                style={[
                  styles.typeFilterText,
                  selectedType === filter.type && styles.typeFilterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'unread' ? '✅' : '🔔'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'unread'
          ? 'You have no unread notifications'
          : 'Notifications will appear here when you receive them'}
      </Text>
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearButton}>Clear Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('all');
              loadNotifications();
            }}
          >
            <Text
              style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'unread' && styles.tabButtonActive,
            ]}
            onPress={() => {
              setActiveTab('unread');
              loadNotifications();
            }}
          >
            <Text
              style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}
            >
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066FF']}
              tintColor="#0066FF"
            />
          }
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyListContent : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
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
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  clearButton: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  statsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  statsButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Type Filters
  typeFiltersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  typeFiltersTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  typeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeFilterChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  typeFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  typeFilterTextActive: {
    color: '#FFFFFF',
  },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'flex-start',
  },
  unread: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  urgentBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
    color: '#999999',
  },
  rightSection: {
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF',
  },
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 28,
    color: '#999999',
    lineHeight: 28,
  },

  // Empty State
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
