import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ResponsiveUtils } from '../../utils/responsive';
import { SocialService } from '../../utils/socialService';


export default function FollowingScreen({ userId, onBack, onViewUser }) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    loadFollowing();
  }, []);


  const loadFollowing = async () => {
    setLoading(true);
    const data = await SocialService.getFollowing(userId);
    setFollowing(data);
    setLoading(false);
  };


  const renderFollowing = ({ item }) => {
    const followedUser = item.following;
    
    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => onViewUser && onViewUser(followedUser)}
        activeOpacity={0.7}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {followedUser.full_name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>


        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {followedUser.full_name}
          </Text>
          <View style={styles.userStats}>
            <Text style={styles.userStat}>⭐ Level {followedUser.level || 1}</Text>
            <Text style={styles.userStat}>• 💰 {followedUser.total_points || 0} pts</Text>
            {followedUser.followers_count > 0 && (
              <Text style={styles.userStat}>• 👥 {followedUser.followers_count}</Text>
            )}
          </View>
        </View>


        <Text style={styles.userArrow}>→</Text>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Following ({following.length})</Text>
          <View style={{ width: 40 }} />
        </View>


        <FlatList
          data={following}
          renderItem={renderFollowing}
          keyExtractor={(item) => item.following_id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadFollowing} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Not Following Anyone</Text>
              <Text style={styles.emptyText}>
                Follow others to see their petitions and updates!
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}


// Use same styles as FollowersScreen
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingTop: ResponsiveUtils.spacing(1.5),
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
  listContainer: {
    padding: ResponsiveUtils.spacing(2),
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  userAvatarText: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(1),
  },
  userStat: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  userArrow: {
    fontSize: ResponsiveUtils.fontSize(20),
    color: '#8E8E93',
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
