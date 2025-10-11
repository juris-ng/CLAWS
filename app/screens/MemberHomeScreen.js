import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { AdminService } from '../../utils/adminService';
import { NetworkMonitor } from '../../utils/networkMonitor';
import { NotificationService } from '../../utils/notificationService';
import { OfflineCache } from '../../utils/offlineCache';
import { PointsService } from '../../utils/pointsService';
import { ResponsiveUtils } from '../../utils/responsive';
import AdminNavigator from './admin/AdminNavigator';
import CreatePetitionScreen from './CreatePetitionScreen';
import FollowersScreen from './FollowersScreen';
import FollowingScreen from './FollowingScreen';
import LeaderboardScreen from './LeaderboardScreen';
import NotificationsScreen from './NotificationsScreen';
import PetitionDetailEnhanced from './PetitionDetailEnhanced';
import ProfileScreen from './ProfileScreen';
import SearchScreen from './SearchScreen';
import UserProfileViewScreen from './UserProfileViewScreen';

export default function MemberHomeScreen({ user, profile: initialProfile, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [petitions, setPetitions] = useState([]);
  const [profile, setProfile] = useState(initialProfile);
  const [userStats, setUserStats] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [showCreatePetition, setShowCreatePetition] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Animation values
  const scrollY = new Animated.Value(0);
  const cardAnimations = petitions.map(() => new Animated.Value(0));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadPetitions(),
      loadUserStats(),
      loadNotificationCount(),
      refreshProfile(),
      checkAdminStatus()
    ]);
    setRefreshing(false);
  };

  const loadPetitions = async () => {
    setLoading(true);
    
    // Check if online
    const networkStatus = await NetworkMonitor.checkConnection();
    setIsOnline(networkStatus.isConnected);
    
    if (networkStatus.isConnected) {
      // Load from network
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          member:members(full_name, avatar_url),
          votes:petition_votes(count),
          comments:comments(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setPetitions(data);
        // Cache the data
        await OfflineCache.cachePetitions(data);
      }
    } else {
      // Load from cache if offline
      const cachedPetitions = await OfflineCache.getCachedPetitions();
      if (cachedPetitions) {
        setPetitions(cachedPetitions);
        Alert.alert('📵 Offline Mode', 'Showing cached petitions. Some data may be outdated.');
      } else {
        Alert.alert('No Connection', 'No cached data available. Please connect to the internet.');
      }
    }
    
    setLoading(false);
  };

  const loadUserStats = async () => {
    const stats = await PointsService.getMemberStats(user.id);
    setUserStats(stats);
  };

  const loadNotificationCount = async () => {
    const unreadCount = await NotificationService.getUnreadCount(user.id);
    setNotificationCount(unreadCount);
  };

  const refreshProfile = async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
      // Cache profile
      await OfflineCache.cacheUserProfile(data);
    }
  };

  const checkAdminStatus = async () => {
    const adminStatus = await AdminService.isAdmin(user.id);
    setIsAdmin(adminStatus);
  };

  // Screen Navigation
  if (showNotifications) {
    return (
      <NotificationsScreen
        user={user}
        profile={profile}
        onBack={() => {
          setShowNotifications(false);
          loadNotificationCount();
        }}
      />
    );
  }

  if (showCreatePetition) {
    return (
      <CreatePetitionScreen
        user={user}
        profile={profile}
        onBack={() => setShowCreatePetition(false)}
        onSuccess={(petition) => {
          setShowCreatePetition(false);
          loadData();
          Alert.alert('Success! 🎉', 'Your petition has been created and you earned +5 points!');
        }}
      />
    );
  }

  if (showSearch) {
    return (
      <SearchScreen
        user={user}
        profile={profile}
        onBack={() => setShowSearch(false)}
      />
    );
  }

  if (showProfile) {
    return (
      <ProfileScreen
        user={user}
        profile={profile}
        onBack={() => {
          setShowProfile(false);
          loadData();
        }}
        onLogout={onLogout}
        onViewFollowers={() => {
          setShowProfile(false);
          setShowFollowers(true);
        }}
        onViewFollowing={() => {
          setShowProfile(false);
          setShowFollowing(true);
        }}
      />
    );
  }

  if (showAdmin) {
    return (
      <AdminNavigator
        user={user}
        profile={profile}
        onBack={() => {
          setShowAdmin(false);
          loadData();
        }}
      />
    );
  }

  if (showLeaderboard) {
    return (
      <LeaderboardScreen
        user={user}
        profile={profile}
        onBack={() => setShowLeaderboard(false)}
        onViewProfile={(targetUser) => {
          setSelectedUserProfile(targetUser);
          setShowLeaderboard(false);
          setShowUserProfile(true);
        }}
      />
    );
  }

  if (showUserProfile && selectedUserProfile) {
    return (
      <UserProfileViewScreen
        user={user}
        profile={profile}
        targetUser={selectedUserProfile}
        onBack={() => {
          setShowUserProfile(false);
          setSelectedUserProfile(null);
        }}
      />
    );
  }

  if (showFollowers) {
    return (
      <FollowersScreen
        userId={user.id}
        onBack={() => setShowFollowers(false)}
        onViewUser={(targetUser) => {
          setSelectedUserProfile(targetUser);
          setShowFollowers(false);
          setShowUserProfile(true);
        }}
      />
    );
  }

  if (showFollowing) {
    return (
      <FollowingScreen
        userId={user.id}
        onBack={() => setShowFollowing(false)}
        onViewUser={(targetUser) => {
          setSelectedUserProfile(targetUser);
          setShowFollowing(false);
          setShowUserProfile(true);
        }}
      />
    );
  }

  if (selectedPetition) {
    return (
      <PetitionDetailEnhanced
        petition={selectedPetition}
        user={user}
        profile={profile}
        onBack={() => {
          setSelectedPetition(null);
          loadData();
        }}
      />
    );
  }

  const renderPetition = ({ item, index }) => {
    const cardWidth = ResponsiveUtils.isTablet 
      ? ResponsiveUtils.getCardWidth(2, 16) - 8
      : '100%';

    return (
      <Animated.View 
        style={[
          styles.petitionCardWrapper,
          { 
            width: cardWidth,
            opacity: cardAnimations[index] || 1,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.petitionCard}
          onPress={() => setSelectedPetition(item)}
          activeOpacity={0.7}
        >
          <View style={styles.petitionHeader}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {item.member?.full_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.petitionHeaderInfo}>
              <Text style={styles.petitionAuthor} numberOfLines={1}>
                {item.member?.full_name || 'Anonymous'}
              </Text>
              <Text style={styles.petitionTime}>
                {new Date(item.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </View>

          <Text style={styles.petitionTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.petitionDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.petitionFooter}>
            <View style={styles.petitionStat}>
              <Text style={styles.statIcon}>👍</Text>
              <Text style={styles.statText}>{item.votes?.[0]?.count || 0}</Text>
            </View>
            <View style={styles.petitionStat}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>{item.comments?.[0]?.count || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const numColumns = ResponsiveUtils.getListColumns();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Compact Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            shadowOpacity: scrollY.interpolate({
              inputRange: [0, 50],
              outputRange: [0, 0.15],
              extrapolate: 'clamp',
            }),
          }
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {profile?.full_name?.split(' ')[0]}! 👋</Text>
          <View style={styles.subGreetingRow}>
            <Text style={styles.subGreeting}>Level {userStats?.level || 1} • {userStats?.total_points || 0} pts</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
            {!isOnline && (
              <View style={styles.offlineIndicator}>
                <Text style={styles.offlineText}>📵 Offline</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowNotifications(true)}
          >
            <Text style={styles.iconButtonText}>🔔</Text>
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setShowProfile(true)}
          >
            <Text style={styles.iconButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Quick Actions Bar */}
      <View style={styles.quickActionsBar}>
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => setShowCreatePetition(true)}
        >
          <Text style={styles.quickActionIcon}>✍️</Text>
          <Text style={styles.quickActionLabel}>Create</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => setShowSearch(true)}
        >
          <Text style={styles.quickActionIcon}>🔍</Text>
          <Text style={styles.quickActionLabel}>Search</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => setShowLeaderboard(true)}
        >
          <Text style={styles.quickActionIcon}>🏆</Text>
          <Text style={styles.quickActionLabel}>Leaderboard</Text>
        </TouchableOpacity>
        
        {isAdmin && (
          <TouchableOpacity 
            style={[styles.quickActionBtn, styles.adminActionBtn]}
            onPress={() => setShowAdmin(true)}
          >
            <Text style={styles.quickActionIcon}>🛡️</Text>
            <Text style={[styles.quickActionLabel, styles.adminActionLabel]}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Feed */}
      <FlatList
        data={petitions}
        renderItem={renderPetition}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContainer}
        numColumns={numColumns}
        key={`list-${numColumns}`}
        columnWrapperStyle={numColumns > 1 ? styles.row : null}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={loadData}
            tintColor="#0066FF"
            colors={['#0066FF']}
            progressBackgroundColor="#FFFFFF"
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>Active Petitions</Text>
            <TouchableOpacity onPress={() => setShowSearch(true)}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No petitions yet</Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setShowCreatePetition(true)}
            >
              <Text style={styles.createFirstButtonText}>Create the First One</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setShowSearch(true)}
        >
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Explore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItemCenter}
          onPress={() => setShowCreatePetition(true)}
        >
          <View style={styles.createButton}>
            <Text style={styles.createButtonIcon}>+</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setShowLeaderboard(true)}
        >
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navLabel}>Leaderboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setShowProfile(true)}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0066FF',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingTop: ResponsiveUtils.isIPhoneX() ? 44 : Platform.OS === 'android' ? 24 : 20,
    paddingBottom: ResponsiveUtils.spacing(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  subGreeting: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: ResponsiveUtils.fontSize(10),
    fontWeight: 'bold',
    color: '#0066FF',
  },
  offlineIndicator: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineText: {
    fontSize: ResponsiveUtils.fontSize(10),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(1),
  },
  iconButton: {
    width: ResponsiveUtils.moderateScale(36),
    height: ResponsiveUtils.moderateScale(36),
    borderRadius: ResponsiveUtils.moderateScale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconButtonText: {
    fontSize: ResponsiveUtils.fontSize(18),
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(10),
    fontWeight: 'bold',
  },
  quickActionsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: ResponsiveUtils.spacing(1.5),
    paddingHorizontal: ResponsiveUtils.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: ResponsiveUtils.spacing(1.5),
  },
  quickActionBtn: {
    alignItems: 'center',
    paddingHorizontal: ResponsiveUtils.spacing(1.5),
  },
  adminActionBtn: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quickActionIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: ResponsiveUtils.fontSize(11),
    fontWeight: '600',
    color: '#3C3C43',
  },
  adminActionLabel: {
    color: '#FF9500',
  },
  feedContainer: {
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: ResponsiveUtils.spacing(2),
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingVertical: ResponsiveUtils.spacing(1.5),
    backgroundColor: '#FFFFFF',
  },
  feedTitle: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  seeAll: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#0066FF',
    fontWeight: '600',
  },
  petitionCardWrapper: {
    marginBottom: 1,
  },
  petitionCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(1.5),
  },
  petitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ResponsiveUtils.spacing(1),
  },
  avatarSmallText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: 'bold',
  },
  petitionHeaderInfo: {
    flex: 1,
  },
  petitionAuthor: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
  },
  petitionTime: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  petitionTitle: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    lineHeight: 20,
  },
  petitionDescription: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#3C3C43',
    lineHeight: 18,
    marginBottom: ResponsiveUtils.spacing(1),
  },
  petitionFooter: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(2),
    paddingTop: ResponsiveUtils.spacing(1),
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  petitionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: ResponsiveUtils.fontSize(14),
  },
  statText: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(7.5),
    paddingHorizontal: ResponsiveUtils.spacing(4),
  },
  emptyIcon: {
    fontSize: ResponsiveUtils.fontSize(48),
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  emptyTitle: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  createFirstButton: {
    backgroundColor: '#0066FF',
    paddingVertical: ResponsiveUtils.spacing(1.25),
    paddingHorizontal: ResponsiveUtils.spacing(2.5),
    borderRadius: 20,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: ResponsiveUtils.spacing(1),
    paddingBottom: ResponsiveUtils.isIPhoneX() ? 20 : ResponsiveUtils.spacing(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  navIcon: {
    fontSize: ResponsiveUtils.fontSize(22),
    marginBottom: 2,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: ResponsiveUtils.fontSize(10),
    color: '#8E8E93',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#0066FF',
    fontWeight: '600',
  },
  createButton: {
    width: ResponsiveUtils.moderateScale(56),
    height: ResponsiveUtils.moderateScale(56),
    borderRadius: ResponsiveUtils.moderateScale(28),
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonIcon: {
    fontSize: ResponsiveUtils.fontSize(28),
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
