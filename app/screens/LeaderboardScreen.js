import { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl, StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ResponsiveUtils } from '../../utils/responsive';
import { SocialService } from '../../utils/socialService';

export default function LeaderboardScreen({ user, profile, onBack, onViewProfile }) {
  const [timeframe, setTimeframe] = useState('all_time');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const [data, rank] = await Promise.all([
      SocialService.getLeaderboard(timeframe, 100),
      SocialService.getUserRank(user.id, timeframe),
    ]);
    setLeaderboard(data);
    setUserRank(rank);
    setLoading(false);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getLevelColor = (level) => {
    if (level >= 9) return '#FFD700'; // Gold
    if (level >= 7) return '#C0C0C0'; // Silver
    if (level >= 5) return '#CD7F32'; // Bronze
    return '#0066FF';
  };

  const renderLeaderItem = ({ item, index }) => {
    const isCurrentUser = item.id === user.id;

    return (
      <TouchableOpacity
        style={[styles.leaderCard, isCurrentUser && styles.leaderCardCurrent]}
        onPress={() => onViewProfile && onViewProfile(item)}
        activeOpacity={0.7}
      >
        <View style={styles.leaderRank}>
          <Text style={[
            styles.leaderRankText,
            index < 3 && styles.leaderRankTopText
          ]}>
            {getRankIcon(item.rank || index + 1)}
          </Text>
        </View>

        <View style={styles.leaderAvatar}>
          <Text style={styles.leaderAvatarText}>
            {item.full_name?.[0]?.toUpperCase() || '?'}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
            <Text style={styles.levelBadgeText}>{item.level}</Text>
          </View>
        </View>

        <View style={styles.leaderInfo}>
          <Text style={styles.leaderName} numberOfLines={1}>
            {item.full_name}
            {isCurrentUser && ' (You)'}
          </Text>
          <View style={styles.leaderStats}>
            <Text style={styles.leaderStat}>
              ⭐ {timeframe === 'all_time' 
                ? item.total_points 
                : timeframe === 'monthly' 
                  ? item.points_this_month 
                  : item.points_this_week} pts
            </Text>
            <Text style={styles.leaderStat}>• 📋 {item.petitions_created}</Text>
            <Text style={styles.leaderStat}>• 👍 {item.votes_cast}</Text>
          </View>
        </View>

        {item.followers_count > 0 && (
          <View style={styles.followersCount}>
            <Text style={styles.followersCountText}>👥 {item.followers_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Timeframe Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, timeframe === 'all_time' && styles.tabActive]}
          onPress={() => setTimeframe('all_time')}
        >
          <Text style={[styles.tabText, timeframe === 'all_time' && styles.tabTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, timeframe === 'monthly' && styles.tabActive]}
          onPress={() => setTimeframe('monthly')}
        >
          <Text style={[styles.tabText, timeframe === 'monthly' && styles.tabTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, timeframe === 'weekly' && styles.tabActive]}
          onPress={() => setTimeframe('weekly')}
        >
          <Text style={[styles.tabText, timeframe === 'weekly' && styles.tabTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Your Rank Card */}
      {userRank && (
        <View style={styles.yourRankCard}>
          <Text style={styles.yourRankLabel}>Your Rank</Text>
          <View style={styles.yourRankRow}>
            <Text style={styles.yourRankNumber}>{getRankIcon(userRank.rank)}</Text>
            <View style={styles.yourRankInfo}>
              <Text style={styles.yourRankPoints}>
                {timeframe === 'all_time' 
                  ? userRank.total_points 
                  : timeframe === 'monthly' 
                    ? userRank.points_this_month 
                    : userRank.points_this_week} points
              </Text>
              <Text style={styles.yourRankStats}>
                {userRank.petitions_created} petitions • {userRank.votes_cast} votes • {userRank.comments_made} comments
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderItem}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLeaderboard} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to contribute and climb the leaderboard!
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: ResponsiveUtils.spacing(1.5),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066FF',
  },
  tabText: {
    fontSize: ResponsiveUtils.fontSize(13),
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#0066FF',
  },
  yourRankCard: {
    backgroundColor: '#0066FF',
    margin: ResponsiveUtils.spacing(2),
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
  },
  yourRankLabel: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: ResponsiveUtils.spacing(1),
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  yourRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yourRankNumber: {
    fontSize: ResponsiveUtils.fontSize(36),
    marginRight: ResponsiveUtils.spacing(2),
  },
  yourRankInfo: {
    flex: 1,
  },
  yourRankPoints: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  yourRankStats: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContainer: {
    padding: ResponsiveUtils.spacing(2),
  },
  leaderCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  leaderCardCurrent: {
    borderColor: '#0066FF',
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  leaderRank: {
    width: 48,
    alignItems: 'center',
  },
  leaderRankText: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  leaderRankTopText: {
    fontSize: ResponsiveUtils.fontSize(28),
  },
  leaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ResponsiveUtils.spacing(1.5),
    position: 'relative',
  },
  leaderAvatarText: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  levelBadgeText: {
    fontSize: ResponsiveUtils.fontSize(10),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  leaderStats: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(1),
  },
  leaderStat: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  followersCount: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: ResponsiveUtils.spacing(1),
    paddingVertical: 4,
    borderRadius: 12,
  },
  followersCountText: {
    fontSize: ResponsiveUtils.fontSize(11),
    fontWeight: '600',
    color: '#3C3C43',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(10),
  },
  emptyIcon: {
    fontSize: ResponsiveUtils.fontSize(64),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  emptyTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  emptyText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
    textAlign: 'center',
  },
});
