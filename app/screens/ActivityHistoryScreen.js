import { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ProfileService } from '../../utils/profileService';

export default function ActivityHistoryScreen({ user, profile, onBack }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'petitions', 'votes', 'comments'

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    const activityData = await ProfileService.getActivityHistory(user.id, 100);
    setActivities(groupActivitiesByDate(activityData));
    setLoading(false);
  };

  const groupActivitiesByDate = (activities) => {
    const grouped = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.created_at);
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    // Convert to section list format
    return Object.keys(grouped).map(date => ({
      title: date,
      data: grouped[date]
    }));
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'petition_created': return '✍️';
      case 'vote_cast': return '👍';
      case 'comment_posted': return '💬';
      case 'badge_earned': return '🏆';
      case 'level_up': return '⭐';
      default: return '📌';
    }
  };

  const getActivityTitle = (activity) => {
    switch (activity.activity_type) {
      case 'petition_created':
        return 'Created a petition';
      case 'vote_cast':
        return 'Voted on a petition';
      case 'comment_posted':
        return 'Posted a comment';
      case 'badge_earned':
        return `Earned "${activity.activity_data?.badge_name}" badge`;
      case 'level_up':
        return `Reached Level ${activity.activity_data?.level}`;
      default:
        return 'Activity';
    }
  };

  const getActivityDescription = (activity) => {
    const data = activity.activity_data || {};
    
    switch (activity.activity_type) {
      case 'petition_created':
        return data.petition_title || 'No title';
      case 'vote_cast':
        return `On: ${data.petition_title || 'Unknown petition'}`;
      case 'comment_posted':
        return data.comment_text?.substring(0, 100) || 'No comment text';
      case 'badge_earned':
        return data.badge_description || '';
      case 'level_up':
        return `Congratulations! You've reached level ${data.level}`;
      default:
        return '';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderActivity = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={styles.timeline}>
        <View style={styles.timelineDot}>
          <Text style={styles.activityIcon}>{getActivityIcon(item.activity_type)}</Text>
        </View>
        <View style={styles.timelineLine} />
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{getActivityTitle(item)}</Text>
          <Text style={styles.activityTime}>{getTimeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.activityDescription} numberOfLines={2}>
          {getActivityDescription(item)}
        </Text>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'petitions', 'votes', 'comments', 'badges'].map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterChip,
                filter === filterType && styles.filterChipActive
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === filterType && styles.filterTextActive
                ]}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Activities List */}
      <SectionList
        sections={activities}
        renderItem={renderActivity}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadActivities} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Activity Yet</Text>
            <Text style={styles.emptyText}>
              Your activity history will appear here
            </Text>
          </View>
        )}
      />
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 15,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activityIcon: {
    fontSize: 18,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5EA',
    marginTop: -4,
  },
  activityContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  activityDescription: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
