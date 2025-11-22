import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { BodyContentService } from '../../utils/bodyContentService';

const COLORS = {
  primary: '#0047AB',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  background: '#F8F9FA',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  purple: '#9C27B0',
  teal: '#009688',
};

const BodyPostsScreen = ({ route, navigation }) => {
  const { bodyId, bodyName } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const contentTypes = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'announcement', label: 'Announcements', icon: 'megaphone-outline' },
    { id: 'project', label: 'Projects', icon: 'construct-outline' },
    { id: 'event', label: 'Events', icon: 'calendar-outline' },
    { id: 'discussion', label: 'Discussions', icon: 'chatbubbles-outline' },
  ];

  const typeConfig = {
    announcement: { color: COLORS.warning, icon: 'megaphone-outline', label: 'Announcement' },
    project: { color: COLORS.success, icon: 'construct-outline', label: 'Project' },
    event: { color: COLORS.purple, icon: 'calendar-outline', label: 'Event' },
    discussion: { color: COLORS.teal, icon: 'chatbubbles-outline', label: 'Discussion' },
  };

  useEffect(() => {
    loadContent();
  }, [selectedType]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const filterType = selectedType === 'all' ? null : selectedType;
      const result = await BodyContentService.getBodyContent(bodyId, filterType);

      if (result.success) {
        setContent(result.content);
      } else {
        Alert.alert('Error', result.error || 'Failed to load content');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }, [selectedType]);

  const navigateToCreate = (type) => {
    setShowCreateModal(false);

    switch (type) {
      case 'announcement':
        navigation.navigate('CreateAnnouncementScreen', { bodyId });
        break;
      case 'project':
        navigation.navigate('CreateProjectScreen', { bodyId });
        break;
      case 'event':
        navigation.navigate('CreateEventScreen', { bodyId });
        break;
      case 'discussion':
        navigation.navigate('CreateDiscussionScreen', { bodyId });
        break;
      default:
        Alert.alert('Coming Soon', `${type} creation coming soon!`);
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
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
          // TODO: Navigate to detail screen
          Alert.alert('Coming Soon', 'Content detail screen coming soon!');
        }}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.typeIconBadge, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon} size={16} color={config.color} />
            </View>
            <Text style={[styles.typeLabel, { color: config.color }]}>
              {config.label.toUpperCase()}
            </Text>
            {item.is_pinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={12} color={COLORS.warning} />
              </View>
            )}
          </View>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Description */}
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Project Progress */}
        {item.content_type === 'project' && item.progress !== null && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
        )}

        {/* Event Date */}
        {item.content_type === 'event' && item.event_date && (
          <View style={styles.eventDateContainer}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.purple} />
            <Text style={styles.eventDateText}>
              {new Date(item.event_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {/* Footer Stats */}
        <View style={styles.cardFooter}>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.likes_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.comments_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={16} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.views_count || 0}</Text>
          </View>
          {item.content_type === 'event' && (
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={16} color={COLORS.mediumGray} />
              <Text style={styles.statText}>{item.attendees_count || 0}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.lightGray} />
      <Text style={styles.emptyTitle}>No Content Yet</Text>
      <Text style={styles.emptyDescription}>
        {selectedType === 'all'
          ? 'Start creating content for your community'
          : `No ${selectedType}s found. Create your first one!`}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.emptyButtonText}>Create Content</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{bodyName}</Text>
          <Text style={styles.headerSubtitle}>Content</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search-outline" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>

      {/* Content Type Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {contentTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterChip,
                selectedType === type.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Ionicons
                name={type.icon}
                size={16}
                color={selectedType === type.id ? COLORS.white : COLORS.mediumGray}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === type.id && styles.filterChipTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : (
        <FlatList
          data={content}
          renderItem={renderContentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentList}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create Content Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Content</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {/* Announcement */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => navigateToCreate('announcement')}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="megaphone-outline" size={24} color={COLORS.warning} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Announcement</Text>
                  <Text style={styles.optionDescription}>
                    Share important announcements with citizens
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>

              {/* Project */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => navigateToCreate('project')}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Ionicons name="construct-outline" size={24} color={COLORS.success} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Project</Text>
                  <Text style={styles.optionDescription}>
                    Create trackable projects with milestones
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>

              {/* Event */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => navigateToCreate('event')}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.purple + '20' }]}>
                  <Ionicons name="calendar-outline" size={24} color={COLORS.purple} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Event</Text>
                  <Text style={styles.optionDescription}>
                    Schedule and manage events
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>

              {/* Discussion */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => navigateToCreate('discussion')}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.teal + '20' }]}>
                  <Ionicons name="chatbubbles-outline" size={24} color={COLORS.teal} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Discussion</Text>
                  <Text style={styles.optionDescription}>
                    Start a discussion with the community
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
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
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  headerButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
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
  contentList: {
    padding: 16,
    paddingBottom: 100,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
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
    gap: 8,
  },
  typeIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  pinnedBadge: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: 10,
    padding: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  eventDateContainer: {
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
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  optionsList: {
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
});

export default BodyPostsScreen;
