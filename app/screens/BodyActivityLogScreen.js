import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { BodyService } from '../../utils/bodyService';

const BodyActivityLogScreen = ({ route, navigation }) => {
  // Get bodyId from route or current user
  const [bodyId, setBodyId] = useState(route.params?.bodyId);
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'posts', label: 'Posts', icon: '📝' },
    { value: 'members', label: 'Members', icon: '👥' },
    { value: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  useEffect(() => {
    initializeBodyId();
  }, []);

  useEffect(() => {
    if (bodyId) {
      loadActivityLog();
    }
  }, [bodyId]);

  const initializeBodyId = async () => {
    if (!bodyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setBodyId(user.id);
      }
    }
  };

  const loadActivityLog = async () => {
    try {
      const result = await BodyService.getActivityLog(bodyId);
      if (result.success) {
        setActivities(result.activities || []);
      }
    } catch (error) {
      console.error('Error loading activity log:', error);
      Alert.alert('Error', 'Failed to load activity log');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivityLog();
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'created_post':
        return '📝';
      case 'updated_post':
        return '✏️';
      case 'deleted_post':
        return '🗑️';
      case 'responded_to_petition':
        return '✅';
      case 'updated_settings':
        return '⚙️';
      case 'added_member':
        return '➕';
      case 'removed_member':
        return '➖';
      case 'updated_profile':
        return '👤';
      case 'created_response':
        return '💬';
      case 'created_campaign':
        return '🚀';
      case 'updated_campaign':
        return '📊';
      case 'created_partnership':
        return '🤝';
      default:
        return '📋';
    }
  };

  const getActivityColor = (action) => {
    if (action.includes('post')) return '#2196F3';
    if (action.includes('petition') || action.includes('response')) return '#4CAF50';
    if (action.includes('settings') || action.includes('profile')) return '#FF9800';
    if (action.includes('member')) return action.includes('added') ? '#4CAF50' : '#F44336';
    if (action.includes('campaign') || action.includes('partnership')) return '#9C27B0';
    return '#666666';
  };

  const getFilterCategory = (action) => {
    if (action.includes('post')) return 'posts';
    if (action.includes('member')) return 'members';
    if (action.includes('settings') || action.includes('profile')) return 'settings';
    return 'other';
  };

  const formatActionText = (action) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;
    return activities.filter((activity) => getFilterCategory(activity.action) === filter);
  };

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
      onPress={() => setFilter(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderActivity = ({ item }) => {
    const icon = getActivityIcon(item.action);
    const color = getActivityColor(item.action);

    return (
      <View style={styles.activityCard}>
        <View style={[styles.activityIconContainer, { backgroundColor: color + '20' }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityAction}>{formatActionText(item.action)}</Text>
            <Text style={styles.activityTime}>{formatTimeAgo(item.created_at)}</Text>
          </View>

          {item.member && (
            <View style={styles.memberInfo}>
              <Text style={styles.memberLabel}>By:</Text>
              <Text style={styles.memberName}>{item.member.full_name || 'Unknown'}</Text>
              {item.member.role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{item.member.role.toUpperCase()}</Text>
                </View>
              )}
            </View>
          )}

          {item.details && Object.keys(item.details).length > 0 && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Details:</Text>
              {Object.entries(item.details).map(([key, value], index) => (
                <Text key={index} style={styles.detailText}>
                  • {key.replace(/_/g, ' ')}: {typeof value === 'object' ? JSON.stringify(value) : value}
                </Text>
              ))}
            </View>
          )}

          {item.description && (
            <Text style={styles.activityDescription}>{item.description}</Text>
          )}
        </View>
      </View>
    );
  };

  const filteredActivities = getFilteredActivities();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading activity log...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9800" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Log</Text>
        <Text style={styles.headerSubtitle}>
          {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={styles.filterIcon}>{item.icon}</Text>
              <Text
                style={[styles.filterText, filter === item.value && styles.filterTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredActivities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No activity yet' : `No ${filter} activity`}
            </Text>
            <Text style={styles.emptySubtext}>
              Organization activities will be logged here automatically
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FF9800',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF3E0',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FF9800',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '600',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  memberLabel: {
    fontSize: 13,
    color: '#999999',
    marginRight: 4,
  },
  memberName: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
    marginRight: 8,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginTop: 4,
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BodyActivityLogScreen;
