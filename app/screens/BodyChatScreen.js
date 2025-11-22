// screens/body/BodyChatScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { BodyContentService } from '../../utils/bodyContentService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_DOWN_HEIGHT = SCREEN_HEIGHT * 0.7;

// CLAWS Brand Colors
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
  teal: '#009688',
};

const BodyChatScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;
  const { user } = useAuth();
  const flatListRef = useRef(null);
  
  const [body, setBody] = useState(null);
  const [content, setContent] = useState([]);
  const [members, setMembers] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('chat');

  const slideAnim = useRef(new Animated.Value(-SLIDE_DOWN_HEIGHT)).current;
  const [slideVisible, setSlideVisible] = useState(false);

  const contentFilters = [
    { id: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline' },
    { id: 'announcement', label: 'News', icon: 'megaphone-outline' },
    { id: 'project', label: 'Projects', icon: 'briefcase-outline' },
    { id: 'event', label: 'Events', icon: 'calendar-outline' },
    { id: 'discussion', label: 'Discussions', icon: 'chatbubbles-outline' },
  ];

  const typeConfig = {
    announcement: { color: COLORS.orange, icon: 'megaphone', label: 'News' },
    project: { color: COLORS.primary, icon: 'briefcase', label: 'Project' },
    event: { color: COLORS.purple, icon: 'calendar', label: 'Event' },
    discussion: { color: COLORS.teal, icon: 'chatbubbles', label: 'Discussion' },
  };

  useEffect(() => {
    fetchBodyData();
    fetchMembers();
    checkMembership();
    loadContent();
  }, [selectedFilter]);

  const fetchBodyData = async () => {
    try {
      const { data, error } = await supabase
        .from('bodies')
        .select('*')
        .eq('id', bodyId)
        .single();

      if (error) throw error;
      setBody(data);
    } catch (error) {
      console.error('Error fetching body:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('body_members')
        .select(`
          *,
          member:member_id (id, full_name, avatar_url)
        `)
        .eq('body_id', bodyId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const checkMembership = async () => {
    try {
      const { data } = await supabase
        .from('body_members')
        .select('*')
        .eq('body_id', bodyId)
        .eq('member_id', user?.id)
        .maybeSingle();

      setIsMember(!!data);
    } catch (error) {
      setIsMember(false);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      
      if (selectedFilter === 'chat') {
        setContent([]);
        setLoading(false);
        return;
      }

      const result = await BodyContentService.getBodyContent(bodyId, selectedFilter);

      if (result.success) {
        setContent(result.content || []);
      } else {
        Alert.alert('Error', result.error || 'Failed to load content');
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }, [selectedFilter]);

  const handlePostMessage = async () => {
    if (!messageText.trim() || !isMember || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('body_content').insert({
        body_id: bodyId,
        content_type: 'discussion',
        title: messageText.trim().substring(0, 50),
        description: messageText.trim(),
        created_by: user.id,
        is_published: true,
      });

      if (error) throw error;
      
      setMessageText('');
      Alert.alert('Success', 'Message posted!');
    } catch (error) {
      console.error('Error posting message:', error);
      Alert.alert('Error', 'Failed to post message');
    } finally {
      setSending(false);
    }
  };

  const toggleSlideDown = () => {
    if (slideVisible) {
      Animated.timing(slideAnim, {
        toValue: -SLIDE_DOWN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSlideVisible(false));
    } else {
      setSlideVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderContentCard = ({ item }) => {
    const config = typeConfig[item.content_type];
    if (!config) return null;

    return (
      <TouchableOpacity
        style={styles.contentCard}
        activeOpacity={0.7}
        onPress={() => {
          Alert.alert('Coming Soon', 'Content detail screen coming soon!');
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.typeIcon, { backgroundColor: config.color + '15' }]}>
              <Ionicons name={config.icon} size={18} color={config.color} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={[styles.typeLabel, { color: config.color }]}>
                {config.label}
              </Text>
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          {item.is_pinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={14} color={COLORS.orange} />
            </View>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {item.content_type === 'project' && item.progress !== null && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
        )}

        {item.content_type === 'event' && item.event_date && (
          <View style={styles.eventDate}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.purple} />
            <Text style={styles.eventDateText}>
              {new Date(item.event_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.likes_count || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.comments_count || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.views_count || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !body) {
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

  if (!isMember) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.notMemberContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={COLORS.lightGray} />
          <Text style={styles.notMemberText}>You are not a member of this organization</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={toggleSlideDown} activeOpacity={0.9}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.orgAvatar}>
            <Text style={styles.orgAvatarText}>{body.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {body.name}
            </Text>
            <Text style={styles.headerSubtitle}>Tap for info</Text>
          </View>
        </View>

        <TouchableOpacity onPress={toggleSlideDown} style={styles.infoButton}>
          <Ionicons 
            name={slideVisible ? 'chevron-up' : 'information-circle-outline'} 
            size={24} 
            color={COLORS.darkGray} 
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {contentFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.tab,
                selectedFilter === filter.id && styles.tabActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={filter.icon} 
                size={18} 
                color={selectedFilter === filter.id ? COLORS.primary : COLORS.mediumGray} 
              />
              <Text style={[
                styles.tabText,
                selectedFilter === filter.id && styles.tabTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MAIN CONTENT AREA - SIMPLE STRUCTURE */}
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <FlatList
          ref={flatListRef}
          data={content}
          renderItem={renderContentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name="chatbubble-ellipses-outline"
                size={64} 
                color={COLORS.lightGray} 
              />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation below!</Text>
            </View>
          }
        />
      </View>

      {/* MESSAGE INPUT BAR - ABSOLUTELY POSITIONED - ALWAYS VISIBLE */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 20 : 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        elevation: 8,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity style={{ padding: 8 }}>
          <Ionicons name="happy-outline" size={22} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <View style={{
          flex: 1,
          backgroundColor: COLORS.veryLightGray,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 44,
          justifyContent: 'center',
        }}>
          <TextInput
            style={{
              fontSize: 15,
              color: COLORS.darkGray,
              maxHeight: 100,
            }}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.mediumGray}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
        </View>

        <TouchableOpacity style={{ padding: 8 }}>
          <Ionicons name="camera-outline" size={22} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: (!messageText.trim() || sending) ? COLORS.mediumGray : COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handlePostMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Slide-down Info Panel */}
      {slideVisible && (
        <Pressable style={styles.slideOverlay} onPress={toggleSlideDown}>
          <Animated.View
            style={[
              styles.slidePanel,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.slideHandle} />

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.slideHeader}>
                  <View style={styles.slideLogo}>
                    <Text style={styles.slideLogoText}>{body.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.slideName}>{body.name}</Text>
                  {body.body_type && (
                    <View style={styles.slideType}>
                      <Text style={styles.slideTypeText}>
                        {body.body_type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {body.description && (
                  <View style={styles.slideSection}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.sectionText}>{body.description}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.slideSection} 
                  onPress={() => {
                    setShowMembersModal(true);
                    toggleSlideDown();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>{members.length} Members</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      )}

      {/* Members Modal */}
      <Modal visible={showMembersModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{members.length} Members</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {item.member?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.member?.full_name || 'Unknown'}</Text>
                    <Text style={styles.memberRole}>{item.role}</Text>
                  </View>
                </View>
              )}
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  notMemberContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 40,
  },
  notMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  goBackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  goBackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orgAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingVertical: 10,
  },
  tabsContent: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  pinnedBadge: {
    padding: 6,
    backgroundColor: COLORS.orange + '15',
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  eventDateText: {
    fontSize: 13,
    color: COLORS.purple,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },

  // Slide Panel
  slideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  slidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SLIDE_DOWN_HEIGHT,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  slideHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  slideHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  slideLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  slideLogoText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  slideName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  slideType: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  slideTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  slideSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 22,
  },

  // Members Modal
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.veryLightGray,
    gap: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textTransform: 'capitalize',
  },
});

export default BodyChatScreen;
