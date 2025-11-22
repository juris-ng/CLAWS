import { useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';


export default function LeaderboardsScreen({ user, profile }) {
  const [activeTab, setActiveTab] = useState('Personal');
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [sectorFilter, setSectorFilter] = useState('Education');
  const [topMembers, setTopMembers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);


  const tabs = ['Personal', 'Body', 'Global'];
  const timeFilters = ['This Week', 'This Month', 'All Time'];
  const sectorFilters = ['Education', 'Healthcare', 'Environment', 'Housing'];


  useEffect(() => {
    loadLeaderboard();
    loadBadges();
  }, [activeTab]);


  const loadLeaderboard = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('points', { ascending: false })
      .limit(10);
    
    if (data) {
      setTopMembers(data);
    }


    setLoading(false);
  };


  const loadBadges = () => {
    setBadges([
      {
        id: 1,
        name: 'Advocate Star',
        description: 'Awarded for initiating 5 successful petitions.',
        icon: '🏆',
        unlocked: true,
        color: '#FFD700',
      },
      {
        id: 2,
        name: 'Idea Champion',
        description: 'Recognized for 10 innovative suggestions.',
        icon: '💡',
        unlocked: false,
        color: '#E5E5EA',
      },
      {
        id: 3,
        name: 'Engagement Pro',
        description: 'Achieved for 50 positive interactions.',
        icon: '📈',
        unlocked: true,
        color: '#34C759',
      },
      {
        id: 4,
        name: 'Community Builder',
        description: 'For inviting 5 new active members.',
        icon: '👥',
        unlocked: false,
        color: '#E5E5EA',
      },
    ]);
  };


  const renderLeaderboardItem = (member, index) => {
    const isCurrentUser = member.id === user.id;
    const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#8E8E93';
    
    return (
      <View 
        key={member.id} 
        style={[
          styles.leaderboardCard,
          isCurrentUser && styles.currentUserCard
        ]}
      >
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {member.full_name?.charAt(0).toUpperCase() || 'M'}
          </Text>
        </View>
        
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.full_name}</Text>
          <Text style={styles.memberPoints}>{member.points} Points</Text>
        </View>
        
        {isCurrentUser && (
          <View style={styles.youBadge}>
            <Text style={styles.youText}>You</Text>
          </View>
        )}
      </View>
    );
  };


  const renderBadge = (badge) => (
    <View 
      key={badge.id} 
      style={[
        styles.badgeCard,
        !badge.unlocked && styles.badgeCardLocked
      ]}
    >
      <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
        <Text style={styles.badgeIconText}>{badge.icon}</Text>
      </View>
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
      {!badge.unlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedIcon}>🔒</Text>
        </View>
      )}
    </View>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leaderboards</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.full_name?.charAt(0).toUpperCase() || 'M'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>


        <ScrollView
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadLeaderboard} />
          }
        >
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.tabActive
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive
                ]}>
                  {tab === 'Personal' ? '👤' : tab === 'Body' ? '👥' : '🌍'} {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>


          {/* Filter by Timeframe */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Timeframe</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChips}
            >
              {timeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    timeFilter === filter && styles.filterChipActive
                  ]}
                  onPress={() => setTimeFilter(filter)}
                >
                  <Text style={[
                    styles.filterChipText,
                    timeFilter === filter && styles.filterChipTextActive
                  ]}>
                    {filter === 'This Week' ? '📅' : filter === 'This Month' ? '📊' : '⏰'} {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>


          {/* Filter by Sector */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Sector</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChips}
            >
              {sectorFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    sectorFilter === filter && styles.filterChipActive
                  ]}
                  onPress={() => setSectorFilter(filter)}
                >
                  <Text style={[
                    styles.filterChipText,
                    sectorFilter === filter && styles.filterChipTextActive
                  ]}>
                    {filter === 'Education' ? '📚' : filter === 'Healthcare' ? '🏥' : filter === 'Environment' ? '🌱' : '🏠'} {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>


          {/* Top Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Members</Text>
            {topMembers.map((member, index) => renderLeaderboardItem(member, index))}
          </View>


          {/* Your Unlocked Badges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Unlocked Badges</Text>
            <View style={styles.badgesGrid}>
              {badges.map(renderBadge)}
            </View>
          </View>
        </ScrollView>
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  filterChips: {
    paddingHorizontal: 15,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  currentUserCard: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberPoints: {
    fontSize: 14,
    color: '#8E8E93',
  },
  youBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    position: 'relative',
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIconText: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  lockedIcon: {
    fontSize: 20,
  },
});
