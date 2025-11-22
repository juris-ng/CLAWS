// screens/body/BodyProfileScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
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
import { BodyContentService } from '../../utils/bodyContentService';
import { BodyService } from '../../utils/bodyService';

// CLAWS Brand Colors - Consistent with HomeScreen
const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  secondary: '#FF6B35',
  orange: '#FF9800',
  success: '#4CAF50',
  error: '#F44336',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  purple: '#9C27B0',
};

const BodyProfileScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;

  const [body, setBody] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Content States
  const [content, setContent] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Members List States
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Followers Modal States
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  useEffect(() => {
    getCurrentUser();
    loadBodyProfile();
  }, [bodyId]);

  useEffect(() => {
    if (currentUserId !== null) {
      loadContent();
    }
  }, [currentUserId, isAdmin, activeTab]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);
  };

  const loadBodyProfile = async () => {
    try {
      const result = await BodyService.getBodyById(bodyId);
      if (result.success) {
        setBody(result.body);
      }

      // Check if user is admin
      if (currentUserId) {
        const adminResult = await BodyService.isBodyAdmin(bodyId, currentUserId);
        if (adminResult.success) {
          setIsAdmin(adminResult.isAdmin);
        }

        // Check if following
        const followResult = await BodyService.isFollowing(bodyId, currentUserId);
        if (followResult.success) {
          setIsFollowing(followResult.isFollowing);
        }
      }
    } catch (error) {
      console.error('Error loading body profile:', error);
      Alert.alert('Error', 'Failed to load body profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadContent = async () => {
    setLoadingContent(true);
    try {
      let result;

      if (activeTab === 'all') {
        result = await BodyContentService.getBodyContent(bodyId, currentUserId, isAdmin);
      } else {
        result = await BodyContentService.getContentByType(
          bodyId,
          activeTab,
          currentUserId,
          isAdmin
        );
      }

      if (result.success) {
        setContent(result.data || []);
      } else {
        console.error('Failed to load content:', result.error);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const result = await BodyService.getBodyMembers(bodyId);
      if (result.success) {
        setMembers(result.members || []);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const result = await BodyService.getBodyFollowers(bodyId);
      if (result.success) {
        setFollowers(result.followers || []);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
      Alert.alert('Error', 'Failed to load followers');
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
    loadMembers();
  };

  const handleViewFollowers = () => {
    setShowFollowersModal(true);
    loadFollowers();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBodyProfile();
    loadContent();
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please login to follow this organization');
      return;
    }

    try {
      if (isFollowing) {
        const result = await BodyService.unfollowBody(bodyId);
        if (result.success) {
          setIsFollowing(false);
          setBody({ ...body, followerCount: (body.followerCount || 1) - 1 });
        }
      } else {
        const result = await BodyService.followBody(bodyId);
        if (result.success) {
          setIsFollowing(true);
          setBody({ ...body, followerCount: (body.followerCount || 0) + 1 });
          loadContent();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleMessage = () => {
    navigation.navigate('ConversationDetail', {
      bodyId: body.id,
      bodyName: body.name,
    });
  };

  const openURL = async (url) => {
    if (!url) return;

    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    try {
      const supported = await Linking.canOpenURL(formattedUrl);
      if (supported) {
        await Linking.openURL(formattedUrl);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'announcement':
        return 'megaphone';
      case 'project':
        return 'briefcase';
      case 'event':
        return 'calendar';
      case 'discussion':
        return 'chatbubbles';
      default:
        return 'document-text';
    }
  };

  const getContentColor = (type) => {
    switch (type) {
      case 'announcement':
        return COLORS.orange;
      case 'project':
        return COLORS.primary;
      case 'event':
        return COLORS.purple;
      case 'discussion':
        return COLORS.success;
      default:
        return COLORS.mediumGray;
    }
  };

  const renderContentItem = ({ item }) => {
    const contentColor = getContentColor(item.content_type);
    const contentIcon = getContentIcon(item.content_type);

    return (
      <TouchableOpacity
        style={styles.contentCard}
        onPress={() => {
          navigation.navigate('ContentDetail', { contentId: item.id });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.contentHeader}>
          <View style={[styles.contentIconContainer, { backgroundColor: contentColor + '15' }]}>
            <Ionicons name={contentIcon} size={22} color={contentColor} />
          </View>
          <View style={styles.contentHeaderText}>
            <Text style={styles.contentType}>
              {item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)}
            </Text>
            <Text style={styles.contentDate}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          {item.visibility && (
            <View style={styles.visibilityBadge}>
              <Ionicons
                name={
                  item.visibility === 'public'
                    ? 'globe-outline'
                    : item.visibility === 'followers'
                    ? 'people-outline'
                    : 'lock-closed-outline'
                }
                size={14}
                color={COLORS.mediumGray}
              />
            </View>
          )}
        </View>

        <Text style={styles.contentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.contentDescription} numberOfLines={2}>
          {item.content}
        </Text>

        {item.category && (
          <View style={styles.contentFooter}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMember = ({ item }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => {
        setShowMembersModal(false);
        navigation.navigate('UserProfile', { userId: item.member?.id });
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.memberAvatar,
          { backgroundColor: item.member?.avatar_url ? 'transparent' : COLORS.primary },
        ]}
      >
        {item.member?.avatar_url ? (
          <Image source={{ uri: item.member.avatar_url }} style={styles.memberAvatarImage} />
        ) : (
          <Text style={styles.memberAvatarText}>
            {item.member?.full_name?.[0]?.toUpperCase() || '?'}
          </Text>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.member?.full_name || 'Anonymous'}</Text>
        <View style={styles.memberMeta}>
          <View
            style={[
              styles.roleBadge,
              item.role === 'owner' && styles.ownerBadge,
              item.role === 'admin' && styles.adminBadge,
            ]}
          >
            <Text style={[styles.roleText, item.role === 'owner' && styles.ownerText]}>
              {item.role === 'owner' ? '👑 Owner' : item.role === 'admin' ? '⚙️ Admin' : 'Member'}
            </Text>
          </View>
        </View>
        {item.joined_at && (
          <Text style={styles.memberDate}>
            Joined {new Date(item.joined_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
    </TouchableOpacity>
  );

  const renderFollower = ({ item }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => {
        setShowFollowersModal(false);
        navigation.navigate('UserProfile', { userId: item.member?.id });
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.memberAvatar,
          { backgroundColor: item.member?.avatar_url ? 'transparent' : COLORS.primary },
        ]}
      >
        {item.member?.avatar_url ? (
          <Image source={{ uri: item.member.avatar_url }} style={styles.memberAvatarImage} />
        ) : (
          <Text style={styles.memberAvatarText}>
            {item.member?.full_name?.[0]?.toUpperCase() || '?'}
          </Text>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.member?.full_name || 'Anonymous'}</Text>
        {item.created_at && (
          <Text style={styles.memberDate}>
            Followed {new Date(item.created_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading organization...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!body) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.errorContainer}>
          <Ionicons name="business-outline" size={64} color={COLORS.lightGray} />
          <Text style={styles.errorText}>Organization not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cover & Profile Section */}
        <View style={styles.profileSection}>
          {/* Cover Image */}
          {body.cover_image_url && (
            <Image source={{ uri: body.cover_image_url }} style={styles.coverImage} />
          )}

          {/* Profile Info */}
          <View style={styles.profileCard}>
            <View style={styles.logoWrapper}>
              {body.logo_url ? (
                <Image source={{ uri: body.logo_url }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>{body.name?.charAt(0)?.toUpperCase() || 'O'}</Text>
                </View>
              )}
              {body.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={14} color={COLORS.white} />
                </View>
              )}
            </View>

            <Text style={styles.bodyName}>{body.name || 'Organization'}</Text>
            <Text style={styles.bodyType}>
              {body.body_type ? body.body_type.replace(/_/g, ' ').toUpperCase() : 'ORGANIZATION'}
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statBox} onPress={handleViewFollowers}>
                <Text style={styles.statNumber}>{body.followerCount || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity style={styles.statBox} onPress={handleViewMembers}>
                <Text style={styles.statNumber}>{body.body_members?.length || 0}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{body.averageRating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {isAdmin ? (
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={() => navigation.navigate('EditBody', { bodyId: body.id })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Manage</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isFollowing && styles.followingButton,
                      { flex: 1 },
                    ]}
                    onPress={handleFollow}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFollowing ? 'checkmark-circle' : 'add-circle-outline'}
                      size={20}
                      color={isFollowing ? COLORS.success : COLORS.white}
                    />
                    <Text
                      style={[
                        styles.primaryButtonText,
                        isFollowing && styles.followingButtonText,
                      ]}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleMessage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {/* About Section */}
        {body.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{body.description}</Text>
          </View>
        )}

        {/* Focus Areas */}
        {body.focus_areas && body.focus_areas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
            <View style={styles.tagsContainer}>
              {body.focus_areas.map((area, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Info */}
        {(body.email || body.phone || body.website || body.location) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Location</Text>
            
            {body.email && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${body.email}`)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.contactText}>{body.email}</Text>
              </TouchableOpacity>
            )}

            {body.phone && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${body.phone}`)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.contactText}>{body.phone}</Text>
              </TouchableOpacity>
            )}

            {body.website && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => openURL(body.website)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.contactText}>{body.website}</Text>
              </TouchableOpacity>
            )}

            {body.location && (
              <View style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.contactText}>{body.location}</Text>
              </View>
            )}
          </View>
        )}

        {/* Content Tabs */}
        <View style={styles.tabsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {[
              { id: 'all', label: 'All', icon: 'grid-outline' },
              { id: 'announcement', label: 'News', icon: 'megaphone-outline' },
              { id: 'project', label: 'Projects', icon: 'briefcase-outline' },
              { id: 'event', label: 'Events', icon: 'calendar-outline' },
              { id: 'discussion', label: 'Discussions', icon: 'chatbubbles-outline' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.id ? COLORS.primary : COLORS.mediumGray}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content List */}
        <View style={styles.contentList}>
          {loadingContent ? (
            <View style={styles.contentLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : content.length > 0 ? (
            <FlatList
              data={content}
              renderItem={renderContentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No {activeTab === 'all' ? 'content' : activeTab} yet</Text>
              {isAdmin && (
                <Text style={styles.emptyHint}>
                  Create your first {activeTab === 'all' ? 'content' : activeTab}!
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Team Members</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            {loadingMembers ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={styles.modalLoading} />
            ) : (
              <FlatList
                data={members}
                renderItem={renderMember}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Followers Modal */}
      <Modal
        visible={showFollowersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Followers</Text>
              <TouchableOpacity onPress={() => setShowFollowersModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            {loadingFollowers ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={styles.modalLoading} />
            ) : (
              <FlatList
                data={followers}
                renderItem={renderFollower}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },

  // Profile Section
  profileSection: {
    backgroundColor: COLORS.white,
  },
  coverImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  profileCard: {
    padding: 20,
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'relative',
    marginTop: -50,
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  bodyName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 4,
  },
  bodyType: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.lightGray,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: COLORS.veryLightGray,
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  followingButtonText: {
    color: COLORS.success,
  },
  secondaryButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
  },

  // Sections
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    color: COLORS.mediumGray,
    lineHeight: 24,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Contact
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
  },

  // Tabs
  tabsSection: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.veryLightGray,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Content
  contentList: {
    padding: 16,
  },
  contentLoading: {
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginTop: 16,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.lightGray,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentHeaderText: {
    flex: 1,
  },
  contentType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  contentDate: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  visibilityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 22,
  },
  contentDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
  },
  contentFooter: {
    flexDirection: 'row',
    marginTop: 12,
  },
  categoryTag: {
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  modalLoading: {
    marginVertical: 40,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.veryLightGray,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  memberMeta: {
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadge: {
    backgroundColor: COLORS.orange + '20',
  },
  adminBadge: {
    backgroundColor: COLORS.primaryLight,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  ownerText: {
    color: COLORS.orange,
  },
  memberDate: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
});

export default BodyProfileScreen;
