import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { AnonymousService } from '../../utils/anonymousService';
import { PointsService } from '../../utils/pointsService';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityCounts, setActivityCounts] = useState({
    petitions: 0,
    signatures: 0,
    comments: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      if (!user) {
        Alert.alert('Error', 'No user found');
        return;
      }

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      // If no profile, create one
      if (!profileData) {
        await createProfile();
        return;
      }

      setProfile(profileData);

      // Get gamification stats
      const statsResult = await PointsService.getMemberStats(user.id);
      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      // Get activity counts
      await loadActivityCounts();
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadActivityCounts = async () => {
    try {
      const [petitions, signatures, comments] = await Promise.all([
        supabase
          .from('petitions')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', user.id),
        supabase
          .from('petition_signatures')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', user.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', user.id),
      ]);

      setActivityCounts({
        petitions: petitions.count || 0,
        signatures: signatures.count || 0,
        comments: comments.count || 0,
      });
    } catch (error) {
      console.error('Error loading activity counts:', error);
    }
  };

  const createProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'New User',
            role: 'member',
            total_points: 0,
            level: 1,
            is_anonymous: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      Alert.alert('Success', 'Profile created successfully!');
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const renderLevelProgress = () => {
    if (!stats) return null;

    const progressPercentage = Math.min(stats.progress_percentage, 100);

    return (
      <View style={styles.levelProgressContainer}>
        <View style={styles.levelProgressHeader}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Level {stats.level}</Text>
          </View>
          <Text style={styles.levelProgressText}>
            {stats.progress_points} / {stats.points_needed} XP
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
          />
        </View>
        <Text style={styles.levelProgressSubtext}>
          {stats.points_needed - stats.progress_points} points to Level{' '}
          {stats.level + 1}
        </Text>
      </View>
    );
  };

  const renderBadgesPreview = () => {
    if (!stats || !stats.badges || stats.badges.length === 0) {
      return (
        <TouchableOpacity
          style={styles.badgesEmptyContainer}
          onPress={() => navigation.navigate('BadgeCollection')}
        >
          <Text style={styles.badgesEmptyIcon}>🏆</Text>
          <Text style={styles.badgesEmptyText}>No badges yet</Text>
          <Text style={styles.badgesEmptySubtext}>
            Earn badges by being active!
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.badgesContainer}>
        <View style={styles.badgesHeader}>
          <Text style={styles.badgesTitle}>
            🏆 Badges ({stats.badges_earned})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('BadgeCollection')}>
            <Text style={styles.badgesViewAll}>View All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesList}
        >
          {stats.badges.slice(0, 5).map((badge, index) => (
            <View key={index} style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName} numberOfLines={1}>
                {badge.name}
              </Text>
            </View>
          ))}
          {stats.badges.length > 5 && (
            <TouchableOpacity
              style={styles.moreBadgesCard}
              onPress={() => navigation.navigate('BadgeCollection')}
            >
              <Text style={styles.moreBadgesText}>
                +{stats.badges.length - 5}
              </Text>
              <Text style={styles.moreBadgesSubtext}>more</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyText}>No profile found</Text>
          <TouchableOpacity style={styles.createButton} onPress={loadProfile}>
            <Text style={styles.createButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayInfo = AnonymousService.getDisplayInfo(profile);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066FF']}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                profile.is_anonymous && { backgroundColor: '#9C27B0' },
              ]}
            >
              <Text style={styles.avatarText}>
                {displayInfo.name[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            {profile.is_anonymous && (
              <View style={styles.anonymousIndicator}>
                <Text style={styles.anonymousIndicatorText}>🔒</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{displayInfo.name}</Text>
          <Text style={styles.email}>{displayInfo.email || 'No email'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile.role?.toUpperCase() || 'MEMBER'}
            </Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.section}>{renderLevelProgress()}</View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{stats?.total_points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏅</Text>
            <Text style={styles.statValue}>{stats?.level || 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{stats?.badges_earned || 0}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Activity Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Activity</Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{activityCounts.petitions}</Text>
              <Text style={styles.activityLabel}>Petitions</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{activityCounts.signatures}</Text>
              <Text style={styles.activityLabel}>Signatures</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{activityCounts.comments}</Text>
              <Text style={styles.activityLabel}>Comments</Text>
            </View>
          </View>
        </View>

        {/* Badges Preview */}
        <View style={styles.section}>{renderBadgesPreview()}</View>

        {/* Points Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.pointsCard}
            onPress={() => navigation.navigate('PointsRedemption')}
            activeOpacity={0.8}
          >
            <View style={styles.pointsCardLeft}>
              <Text style={styles.pointsCardIcon}>💎</Text>
              <View style={styles.pointsCardInfo}>
                <Text style={styles.pointsCardLabel}>Available Points</Text>
                <Text style={styles.pointsCardValue}>
                  {stats?.total_points || 0}
                </Text>
              </View>
            </View>
            <View style={styles.pointsCardRight}>
              <Text style={styles.pointsCardButton}>Redeem</Text>
              <Text style={styles.pointsCardArrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AnonymousSettings')}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Anonymous Mode</Text>
              <Text style={styles.menuSubtext}>
                {profile.is_anonymous ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ActivityHistory')}
          >
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={styles.menuText}>Activity History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PointsHistory')}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>Points History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={styles.menuIcon}>🏆</Text>
            <Text style={styles.menuText}>Leaderboard</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>App Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* My Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 My Content</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ManagePetitions')}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>My Petitions</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activityCounts.petitions}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MyAppeals')}
          >
            <Text style={styles.menuIcon}>⚖️</Text>
            <Text style={styles.menuText}>My Appeals</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Governance App v1.0</Text>
          <Text style={styles.footerSubtext}>
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    backgroundColor: '#0066FF',
    padding: 32,
    paddingTop: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  anonymousIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0066FF',
  },
  anonymousIndicatorText: {
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#E3F2FD',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sections
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },

  // Level Progress
  levelProgressContainer: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  levelProgressSubtext: {
    fontSize: 12,
    color: '#999999',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },

  // Activity Grid
  activityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activityValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Badges
  badgesContainer: {},
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  badgesViewAll: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  badgesList: {
    gap: 12,
  },
  badgeCard: {
    width: 80,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  moreBadgesCard: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#0066FF',
    borderRadius: 12,
  },
  moreBadgesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  moreBadgesSubtext: {
    fontSize: 11,
    color: '#E3F2FD',
    fontWeight: '600',
  },
  badgesEmptyContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  badgesEmptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  badgesEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  badgesEmptySubtext: {
    fontSize: 13,
    color: '#999999',
  },

  // Points Card
  pointsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  pointsCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pointsCardIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  pointsCardInfo: {},
  pointsCardLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  pointsCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  pointsCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsCardButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginRight: 4,
  },
  pointsCardArrow: {
    fontSize: 24,
    color: '#F57C00',
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 24,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuSubtext: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#CCCCCC',
  },
  countBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
  },

  // Footer
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CCCCCC',
  },
});

export default ProfileScreen;
