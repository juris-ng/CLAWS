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
import { supabase } from '../../supabase';
import { BodyAnalyticsService } from '../../utils/bodyAnalyticsService';

const AnalyticsGoalsScreen = ({ route, navigation }) => {
  // Get bodyId from route or current user
  const [bodyId, setBodyId] = useState(route.params?.bodyId);
  const [goals, setGoals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { value: 'all', label: 'All', icon: '📊' },
    { value: 'active', label: 'Active', icon: '🎯' },
    { value: 'achieved', label: 'Achieved', icon: '✅' },
    { value: 'missed', label: 'Missed', icon: '❌' },
  ];

  useEffect(() => {
    initializeBodyId();
  }, []);

  useEffect(() => {
    if (bodyId) {
      loadGoals();
    }
  }, [bodyId, filter]);

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

  const loadGoals = async () => {
    try {
      const result = await BodyAnalyticsService.getGoals(
        bodyId,
        filter === 'all' ? null : filter
      );
      if (result.success) {
        setGoals(result.goals || []);
      } else {
        Alert.alert('Error', result.error || 'Failed to load goals');
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGoals();
  };

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'followers':
        return '👥';
      case 'engagement':
        return '📊';
      case 'response_time':
        return '⏱️';
      case 'impact':
        return '🎯';
      case 'posts':
        return '📝';
      case 'partnerships':
        return '🤝';
      default:
        return '📈';
    }
  };

  const calculateProgress = (current, target) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = (status, progress, daysRemaining) => {
    if (status === 'achieved') {
      return { label: '✅ Achieved', color: '#4CAF50', bgColor: '#E8F5E9' };
    }
    if (status === 'missed') {
      return { label: '❌ Missed', color: '#F44336', bgColor: '#FFEBEE' };
    }
    if (progress >= 75) {
      return { label: '🚀 On Track', color: '#2196F3', bgColor: '#E3F2FD' };
    }
    if (daysRemaining !== null && daysRemaining <= 7) {
      return { label: '⚠️ Urgent', color: '#FF9800', bgColor: '#FFF3E0' };
    }
    return { label: '🎯 Active', color: '#9C27B0', bgColor: '#F3E5F5' };
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

  const renderGoal = ({ item }) => {
    const icon = getGoalTypeIcon(item.goal_type);
    const progress = calculateProgress(item.current_value, item.target_value);
    const daysRemaining = getDaysRemaining(item.deadline);
    const statusInfo = getStatusInfo(item.status, progress, daysRemaining);

    return (
      <TouchableOpacity
        style={styles.goalCard}
        onPress={() =>
          navigation.navigate('GoalDetail', { goalId: item.id, bodyId })
        }
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* Goal Header */}
        <View style={styles.goalHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.goalIcon}>{icon}</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalType}>
              {item.goal_type?.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.goalMetric} numberOfLines={2}>
              {item.target_metric}
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.currentValue}>{item.current_value?.toLocaleString()}</Text>
            <Text style={styles.targetValue}>
              {' '}
              / {item.target_value?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor:
                    progress >= 100
                      ? '#4CAF50'
                      : progress >= 75
                      ? '#2196F3'
                      : progress >= 50
                      ? '#FF9800'
                      : '#F44336',
                },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>{progress.toFixed(1)}% Complete</Text>
        </View>

        {/* Deadline */}
        {item.deadline && (
          <View style={styles.deadlineContainer}>
            <Text style={styles.deadlineIcon}>📅</Text>
            <Text
              style={[
                styles.deadlineText,
                daysRemaining !== null && daysRemaining < 7 && styles.deadlineUrgent,
              ]}
            >
              {item.status === 'achieved'
                ? `Achieved on ${new Date(item.achieved_at).toLocaleDateString()}`
                : daysRemaining !== null
                ? daysRemaining > 0
                  ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                  : daysRemaining === 0
                  ? 'Due today!'
                  : `Overdue by ${Math.abs(daysRemaining)} day${
                      Math.abs(daysRemaining) !== 1 ? 's' : ''
                    }`
                : `Deadline: ${new Date(item.deadline).toLocaleDateString()}`}
            </Text>
          </View>
        )}

        {/* Creator */}
        {item.creator && (
          <Text style={styles.creatorText}>
            Created by: {item.creator.full_name || 'Unknown'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Goals & Targets</Text>
          <Text style={styles.headerSubtitle}>
            {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={filters}
            renderItem={renderFilter}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        {/* Goals List */}
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'No goals set'
                  : `No ${filter} goals`}
              </Text>
              <Text style={styles.emptySubtext}>
                Set goals to track your organization's progress and achievements
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Create Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateGoal', { bodyId })}
        >
          <Text style={styles.addButtonText}>+ Create Goal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    paddingBottom: 80,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginRight: 100,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalIcon: {
    fontSize: 28,
  },
  goalInfo: {
    flex: 1,
  },
  goalType: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 4,
  },
  goalMetric: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  targetValue: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '600',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deadlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deadlineText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
    flex: 1,
  },
  deadlineUrgent: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  creatorText: {
    fontSize: 12,
    color: '#999999',
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AnalyticsGoalsScreen;
