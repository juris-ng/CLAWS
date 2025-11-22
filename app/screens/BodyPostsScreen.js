import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { BodyContentService } from '../../utils/bodyContentService';

// ✅ UPDATED: Consistent blue color scheme matching dashboard
const COLORS = {
  primary: '#1A73E8',        // ✅ Dashboard blue
  primaryLight: '#E3F2FD',   // ✅ Light blue background
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#202124',       // ✅ Dashboard dark text
  mediumGray: '#5F6368',     // ✅ Dashboard medium gray
  lightGray: '#E8EAED',      // ✅ Dashboard borders
  background: '#F8F9FA',     // ✅ Dashboard background
  success: '#34A853',
  error: '#EA4335',
  warning: '#FBBC04',
  purple: '#9C27B0',
  teal: '#00ACC1',
};

const BodyPostsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const contentTypes = [
    { key: 'all', label: 'All', icon: 'apps-outline' },
    { key: 'announcement', label: 'Announcements', icon: 'megaphone-outline' },
    { key: 'project', label: 'Projects', icon: 'construct-outline' },
    { key: 'event', label: 'Events', icon: 'calendar-outline' },
    { key: 'discussion', label: 'Discussions', icon: 'chatbubbles-outline' },
  ];

  useEffect(() => {
    loadContent();
  }, [selectedFilter]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const filter = selectedFilter === 'all' ? null : selectedFilter;
      const result = await BodyContentService.getBodyContent(filter);

      if (result.success) {
        setContent(result.content);
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

  const handleContentPress = (item) => {
    const routeMap = {
      announcement: 'AnnouncementDetail',
      project: 'ProjectDetail',
      event: 'EventDetail',
      discussion: 'DiscussionDetail',
    };

    const routeName = routeMap[item.content_type];
    if (routeName) {
      navigation.navigate(routeName, { contentId: item.id });
    }
  };

  const handleCreateContent = (type) => {
    setCreateModalVisible(false);
    const routeMap = {
      announcement: 'CreateAnnouncementScreen',
      project: 'CreateProjectScreen',
      event: 'CreateEventScreen',
      discussion: 'CreateDiscussionScreen',
    };

    const routeName = routeMap[type];
    if (routeName) {
      navigation.navigate(routeName);
    }
  };

  const getContentIcon = (type) => {
    const iconMap = {
      announcement: 'megaphone',
      project: 'construct',
      event: 'calendar',
      discussion: 'chatbubbles',
    };
    return iconMap[type] || 'document-text';
  };

  const getContentColor = (type) => {
    const colorMap = {
      announcement: COLORS.primary,
      project: COLORS.success,
      event: COLORS.purple,
      discussion: COLORS.teal,
    };
    return colorMap[type] || COLORS.mediumGray;
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
    const iconColor = getContentColor(item.content_type);

    return (
      <TouchableOpacity
        style={styles.contentCard}
        onPress={() => handleContentPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={getContentIcon(item.content_type)} size={20} color={iconColor} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.contentMeta}>{formatDate(item.created_at)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </View>

        {item.description && (
          <Text style={styles.contentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.views_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.likes_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.comments_count || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={createModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setCreateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Content</Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TouchableOpacity
              style={styles.createOption}
              onPress={() => handleCreateContent('announcement')}
            >
              <View style={[styles.createOptionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="megaphone" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.createOptionText}>
                <Text style={styles.createOptionTitle}>Announcement</Text>
                <Text style={styles.createOptionDescription}>
                  Share important updates and news
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => handleCreateContent('project')}
            >
              <View style={[styles.createOptionIcon, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="construct" size={24} color={COLORS.success} />
              </View>
              <View style={styles.createOptionText}>
                <Text style={styles.createOptionTitle}>Project</Text>
                <Text style={styles.createOptionDescription}>
                  Start a new initiative or program
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => handleCreateContent('event')}
            >
              <View style={[styles.createOptionIcon, { backgroundColor: COLORS.purple + '15' }]}>
                <Ionicons name="calendar" size={24} color={COLORS.purple} />
              </View>
              <View style={styles.createOptionText}>
                <Text style={styles.createOptionTitle}>Event</Text>
                <Text style={styles.createOptionDescription}>
                  Organize meetings and gatherings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => handleCreateContent('discussion')}
            >
              <View style={[styles.createOptionIcon, { backgroundColor: COLORS.teal + '15' }]}>
                <Ionicons name="chatbubbles" size={24} color={COLORS.teal} />
              </View>
              <View style={styles.createOptionText}>
                <Text style={styles.createOptionTitle}>Discussion</Text>
                <Text style={styles.createOptionDescription}>
                  Start a conversation topic
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ✅ Clean Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ✅ Filter Chips */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={contentTypes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={selectedFilter === item.key ? COLORS.white : COLORS.mediumGray}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => item.id}
          renderItem={renderContentCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No content yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first {selectedFilter === 'all' ? 'content' : selectedFilter}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setCreateModalVisible(true)}
              >
                <Text style={styles.emptyButtonText}>Create Content</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderCreateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  createButton: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  contentDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  modalBody: {
    padding: 20,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  createOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  createOptionText: {
    flex: 1,
  },
  createOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 3,
  },
  createOptionDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
});

export default BodyPostsScreen;
