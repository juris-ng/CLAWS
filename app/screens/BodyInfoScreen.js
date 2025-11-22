// screens/body/BodyInfoScreen.js
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

const BodyInfoScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;

  const [body, setBody] = useState(null);
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

      if (currentUserId) {
        const adminResult = await BodyService.isBodyAdmin(bodyId, currentUserId);
        if (adminResult.success) {
          setIsAdmin(adminResult.isAdmin);
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
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
    loadMembers();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBodyProfile();
    loadContent();
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
        return '#FF9800';
      case 'project':
        return '#2196F3';
      case 'event':
        return '#9C27B0';
      case 'discussion':
        return '#009688';
      default:
        return '#666666';
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
          <View style={[styles.contentIcon, { backgroundColor: contentColor + '20' }]}>
            <Ionicons name={contentIcon} size={20} color={contentColor} />
          </View>
          <View style={styles.contentHeaderText}>
            <Text style={styles.contentType}>
              {item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)}
            </Text>
            <Text style={styles.contentDate}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
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
                size={12}
                color="#666"
              />
              <Text style={styles.visibilityText}>
                {item.visibility.charAt(0).toUpperCase() + item.visibility.slice(1)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.contentTitle}>{item.title}</Text>
        <Text style={styles.contentDescription} numberOfLines={2}>
          {item.content}
        </Text>

        {item.category && (
          <View style={styles.contentFooter}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMember = ({ item }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => {
        setShowMembersModal(false);
        navigation.navigate('UserProfile', { userId: item.member?.id });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.listAvatar}>
        {item.member?.avatar_url ? (
          <Image source={{ uri: item.member.avatar_url }} style={styles.listAvatarImage} />
        ) : (
          <Text style={styles.listAvatarText}>
            {item.member?.full_name?.[0]?.toUpperCase() || '?'}
          </Text>
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.member?.full_name || 'Anonymous'}</Text>
        <View style={styles.listMeta}>
          <View
            style={[
              styles.listBadge,
              item.role === 'owner' && styles.ownerBadge,
              item.role === 'admin' && styles.adminBadge,
            ]}
          >
            <Text style={styles.listBadgeText}>
              {item.role === 'owner'
                ? '👑 Owner'
                : item.role === 'admin'
                ? '⚙️ Admin'
                : '👤 Member'}
            </Text>
          </View>
        </View>
        {item.joined_at && (
          <Text style={styles.listDate}>
            Joined {new Date(item.joined_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.listAction}>
        <Text style={styles.listArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      </SafeAreaView>
    );
  }

  if (!body) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorText}>Body not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Body Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        {body.cover_image_url && (
          <Image source={{ uri: body.cover_image_url }} style={styles.coverImage} />
        )}

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.logoContainer}>
            {body.logo_url ? (
              <Image source={{ uri: body.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{body.name?.charAt(0)?.toUpperCase() || 'B'}</Text>
              </View>
            )}
            {body.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>

          <Text style={styles.bodyName}>{body.name || 'Organization'}</Text>
          <Text style={styles.bodyType}>
            {body.body_type ? body.body_type.replace(/_/g, ' ').toUpperCase() : 'ORGANIZATION'}
          </Text>

          {/* Stats */}
          <View style={styles.stats}>
            <TouchableOpacity style={styles.statItem} onPress={handleViewMembers}>
              <Text style={styles.statNumber}>{body.body_members?.length || 0}</Text>
              <Text style={styles.statLabel}>Team</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{body.averageRating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Action Button */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate('EditBody', { bodyId: body.id })}
            >
              <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
              <Text style={styles.manageButtonText}>Manage Body</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'all', label: 'All', icon: 'apps' },
              { id: 'announcement', label: 'Announcements', icon: 'megaphone' },
              { id: 'project', label: 'Projects', icon: 'briefcase' },
              { id: 'event', label: 'Events', icon: 'calendar' },
              { id: 'discussion', label: 'Discussions', icon: 'chatbubbles' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.id ? '#1E88E5' : '#666'}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content List */}
        <View style={styles.contentSection}>
          {loadingContent ? (
            <View style={styles.contentLoading}>
              <ActivityIndicator size="large" color="#1E88E5" />
            </View>
          ) : content.length > 0 ? (
            <FlatList
              data={content}
              renderItem={renderContentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContent}>
              <Ionicons name="file-tray-outline" size={64} color="#CCC" />
              <Text style={styles.emptyContentText}>No content available</Text>
            </View>
          )}
        </View>

        {/* Focus Areas */}
        {body.focus_areas && body.focus_areas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
            <View style={styles.focusAreasContainer}>
              {body.focus_areas.map((area, index) => (
                <View key={index} style={styles.focusAreaChip}>
                  <Text style={styles.focusAreaText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About */}
        {body.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{body.description}</Text>
          </View>
        )}

        {/* Contact Info */}
        {(body.email || body.phone || body.website) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {body.email && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL(`mailto:${body.email}`)}
              >
                <Ionicons name="mail-outline" size={20} color="#666" />
                <Text style={styles.contactText}>{body.email}</Text>
              </TouchableOpacity>
            )}
            {body.phone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL(`tel:${body.phone}`)}
              >
                <Ionicons name="call-outline" size={20} color="#666" />
                <Text style={styles.contactText}>{body.phone}</Text>
              </TouchableOpacity>
            )}
            {body.website && (
              <TouchableOpacity style={styles.contactItem} onPress={() => openURL(body.website)}>
                <Ionicons name="globe-outline" size={20} color="#666" />
                <Text style={styles.contactText}>{body.website}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Location */}
        {body.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.locationText}>{body.location}</Text>
            </View>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Team Members</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {loadingMembers ? (
              <ActivityIndicator size="large" color="#1E88E5" style={styles.modalLoading} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#1E88E5',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bodyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  bodyType: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  manageButton: {
    flexDirection: 'row',
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  contentSection: {
    padding: 16,
  },
  contentLoading: {
    paddingVertical: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContentText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  contentType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  visibilityText: {
    fontSize: 11,
    color: '#666',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contentFooter: {
    flexDirection: 'row',
    marginTop: 12,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  focusAreasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusAreaChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  focusAreaText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalLoading: {
    marginVertical: 40,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  listAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadge: {
    backgroundColor: '#FFF3E0',
  },
  adminBadge: {
    backgroundColor: '#E3F2FD',
  },
  listBadgeText: {
    fontSize: 12,
    color: '#666',
  },
  listDate: {
    fontSize: 12,
    color: '#999',
  },
  listAction: {
    marginLeft: 12,
  },
  listArrow: {
    fontSize: 24,
    color: '#CCC',
  },
});

export default BodyInfoScreen;
