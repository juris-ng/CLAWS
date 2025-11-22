import { useEffect, useState } from 'react';
import {
  Alert,
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
import { ResponsiveUtils } from '../../utils/responsive';
import { SocialService } from '../../utils/socialService';


export default function UserProfileViewScreen({ user, profile: currentUserProfile, targetUser, onBack }) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPetitions, setUserPetitions] = useState([]);
  const [userStats, setUserStats] = useState(null);


  useEffect(() => {
    loadUserProfile();
  }, []);


  const loadUserProfile = async () => {
    setLoading(true);
    await Promise.all([
      checkFollowStatus(),
      loadUserPetitions(),
      loadUserStats(),
    ]);
    setLoading(false);
  };


  const checkFollowStatus = async () => {
    const following = await SocialService.isFollowing(user.id, targetUser.id);
    setIsFollowing(following);
  };


  const loadUserPetitions = async () => {
    const { data, error } = await supabase
      .from('petitions')
      .select(`
        *,
        votes:petition_votes(count),
        comments:comments(count)
      `)
      .eq('member_id', targetUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);


    if (!error) setUserPetitions(data || []);
  };


  const loadUserStats = async () => {
    const { data, error } = await supabase
      .rpc('get_member_stats', { member_id: targetUser.id });


    if (!error) setUserStats(data);
  };


  const handleFollowToggle = async () => {
    if (isFollowing) {
      const result = await SocialService.unfollowUser(user.id, targetUser.id);
      if (result.success) {
        setIsFollowing(false);
        Alert.alert('Unfollowed', `You unfollowed ${targetUser.full_name}`);
      }
    } else {
      const result = await SocialService.followUser(user.id, targetUser.id);
      if (result.success) {
        setIsFollowing(true);
        Alert.alert('Following!', `You are now following ${targetUser.full_name}`);
      }
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>


        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadUserProfile} />
          }
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {targetUser.full_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>


            <Text style={styles.userName}>{targetUser.full_name}</Text>
            {targetUser.bio && <Text style={styles.userBio}>{targetUser.bio}</Text>}


            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{targetUser.total_points || 0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{targetUser.level || 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{targetUser.followers_count || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{targetUser.following_count || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>


            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              onPress={handleFollowToggle}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                {isFollowing ? '✓ Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Petitions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Petitions ({userPetitions.length})</Text>
            {userPetitions.map((petition) => (
              <View key={petition.id} style={styles.petitionCard}>
                <Text style={styles.petitionTitle} numberOfLines={2}>
                  {petition.title}
                </Text>
                <Text style={styles.petitionDescription} numberOfLines={2}>
                  {petition.description}
                </Text>
                <View style={styles.petitionStats}>
                  <Text style={styles.petitionStat}>👍 {petition.votes?.[0]?.count || 0}</Text>
                  <Text style={styles.petitionStat}>💬 {petition.comments?.[0]?.count || 0}</Text>
                </View>
              </View>
            ))}


            {userPetitions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No petitions yet</Text>
              </View>
            )}
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingTop: 12,
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(3),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  avatarLargeText: {
    fontSize: ResponsiveUtils.fontSize(40),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: ResponsiveUtils.fontSize(24),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  userBio: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: ResponsiveUtils.spacing(2),
    paddingVertical: ResponsiveUtils.spacing(2),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#0066FF',
    paddingVertical: ResponsiveUtils.spacing(1.5),
    paddingHorizontal: ResponsiveUtils.spacing(4),
    borderRadius: 20,
  },
  followButtonActive: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  followButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followButtonTextActive: {
    color: '#0066FF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  sectionTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  petitionCard: {
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  petitionTitle: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    marginBottom: 4,
  },
  petitionDescription: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#8E8E93',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  petitionStats: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(2),
  },
  petitionStat: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(4),
  },
  emptyText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
  },
});
