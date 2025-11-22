import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { BodyCollaborationService } from '../../utils/bodyCollaborationService';
import { BodyContentService } from '../../utils/bodyContentService';
import { BodyService } from '../../utils/bodyService';

const { width } = Dimensions.get('window');

const BodyPartnershipsScreen = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const bodyId = route.params?.bodyId || userProfile?.id;

  const [activeTab, setActiveTab] = useState('partnerships');
  const [partnerships, setPartnerships] = useState([]);
  const [availableBodies, setAvailableBodies] = useState([]);
  const [myContent, setMyContent] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filters = [
    { value: 'all', label: 'All', icon: 'apps-outline', color: '#1A73E8' },
    { value: 'pending', label: 'Pending', icon: 'time-outline', color: '#FF9800' },
    { value: 'accepted', label: 'Active', icon: 'checkmark-circle-outline', color: '#4CAF50' },
    { value: 'rejected', label: 'Rejected', icon: 'close-circle-outline', color: '#F44336' }
  ];

  const tabs = [
    { value: 'partnerships', label: 'Partnerships', icon: 'people-outline' },
    { value: 'content', label: 'My Content', icon: 'folder-outline' },
    { value: 'browse', label: 'Browse', icon: 'search-outline' },
  ];

  useEffect(() => {
    if (bodyId) loadData();
  }, [bodyId, activeTab, filter]);

  const loadData = async () => {
    if (!bodyId) return;
    
    try {
      if (activeTab === 'partnerships') {
        await loadPartnerships();
      } else if (activeTab === 'browse') {
        await loadAvailableBodies();
      } else if (activeTab === 'content') {
        await loadMyContent();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPartnerships = async () => {
    const statusFilter = filter === 'all' ? null : filter;
    const result = await BodyCollaborationService.getBodyPartnerships(bodyId, statusFilter);
    if (result.success) setPartnerships(result.partnerships);
  };

  const loadAvailableBodies = async () => {
    const result = await BodyService.searchBodies(searchQuery);
    if (result.success) {
      const filtered = result.bodies.filter(b => b.id !== bodyId);
      setAvailableBodies(filtered);
    }
  };

  const loadMyContent = async () => {
    const result = await BodyContentService.getBodyContent(bodyId);
    if (result.success) {
      setMyContent(result.content);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleInviteBody = async (targetBodyId, targetBodyName) => {
    Alert.alert(
      'Send Partnership Invitation',
      `Invite ${targetBodyName} to partner?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            const result = await BodyCollaborationService.createPartnership({
              initiator_body_id: bodyId,
              partner_body_id: targetBodyId,
              partnership_type: 'general_collaboration',
              title: 'Partnership Invitation',
              status: 'pending'
            });
            if (result.success) {
              Alert.alert('Success', 'Invitation sent!');
              loadAvailableBodies();
            }
          }
        }
      ]
    );
  };

  const handleAcceptPartnership = async (partnershipId) => {
    const result = await BodyCollaborationService.updatePartnershipStatus(partnershipId, 'accepted');
    if (result.success) {
      Alert.alert('Success', 'Partnership accepted');
      loadPartnerships();
    }
  };

  const handleRejectPartnership = async (partnershipId) => {
    const result = await BodyCollaborationService.updatePartnershipStatus(partnershipId, 'rejected');
    if (result.success) {
      Alert.alert('Success', 'Partnership rejected');
      loadPartnerships();
    }
  };

  const handleCreateContent = (type) => {
    setShowCreateModal(false);
    if (type === 'project') {
      navigation.navigate('CreateProjectScreen', { bodyId });
    } else {
      navigation.navigate('CreateEventScreen', { bodyId });
    }
  };

  const handleContentClick = (item) => {
    if (item.type === 'event') {
      navigation.navigate('EventDetailsScreen', { eventId: item.id });
    } else {
      navigation.navigate('ProjectDetailsScreen', { projectId: item.id });
    }
  };

  const renderTab = ({ item }) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === item.value && styles.tabActive]}
      onPress={() => {
        setActiveTab(item.value);
        setLoading(true);
      }}
    >
      <Ionicons 
        name={item.icon} 
        size={22} 
        color={activeTab === item.value ? '#1A73E8' : '#9CA3AF'} 
      />
      <Text style={[styles.tabText, activeTab === item.value && styles.tabTextActive]}>
        {item.label}
      </Text>
      {activeTab === item.value && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === item.value && { backgroundColor: item.color }]}
      onPress={() => setFilter(item.value)}
    >
      <Ionicons 
        name={item.icon} 
        size={18} 
        color={filter === item.value ? '#FFFFFF' : item.color} 
      />
      <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderPartnership = ({ item }) => {
    const isInitiator = item.initiator_body_id === bodyId;
    const partnerBody = isInitiator ? item.partner : item.initiator;
    const statusColor = item.status === 'pending' ? '#FF9800' : 
                       item.status === 'accepted' ? '#4CAF50' : '#F44336';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.partnerRow}>
            {partnerBody?.logo_url ? (
              <Image source={{ uri: partnerBody.logo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: statusColor }]}>
                <Text style={styles.avatarText}>
                  {partnerBody?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{partnerBody?.name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {isInitiator ? '📤 Sent' : '📥 Received'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>

        {!isInitiator && item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectPartnership(item.id)}
            >
              <Ionicons name="close" size={18} color="#F44336" />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptPartnership(item.id)}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderAvailableBody = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.partnerRow}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#1A73E8' }]}>
              <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{item.name}</Text>
            <Text style={styles.categoryText}>{item.category || 'Organization'}</Text>
          </View>
        </View>
      </View>

      {item.description && (
        <View style={styles.cardBody}>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.inviteButton}
        onPress={() => handleInviteBody(item.id, item.name)}
      >
        <LinearGradient
          colors={['#1A73E8', '#0D47A1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>Send Invitation</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderContentItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleContentClick(item)}>
      <View style={styles.cardTop}>
        <View style={styles.partnerRow}>
          <View style={[styles.contentIconContainer, {
            backgroundColor: item.type === 'event' ? '#4CAF5020' : '#2196F320'
          }]}>
            <Ionicons 
              name={item.type === 'event' ? 'calendar-outline' : 'cube-outline'} 
              size={28} 
              color={item.type === 'event' ? '#4CAF50' : '#2196F3'} 
            />
          </View>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{item.title || item.name}</Text>
            <Text style={styles.categoryText}>
              {item.type === 'event' ? '📅 Event' : '🎯 Project'}
              {item.date && ` · ${new Date(item.date || item.created_at).toLocaleDateString()}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </View>

      {item.description && (
        <View style={styles.cardBody}>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCreateModal = () => (
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
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Content to Share</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleCreateContent('project')}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="cube-outline" size={32} color="#4CAF50" />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Project</Text>
              <Text style={styles.optionSubtitle}>Start a new initiative or program</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleCreateContent('event')}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#9C27B020' }]}>
              <Ionicons name="calendar-outline" size={32} color="#9C27B0" />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Event</Text>
              <Text style={styles.optionSubtitle}>Organize meetings and gatherings</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ✅ UPDATED: Empty state with centered Create Content button
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={
          activeTab === 'partnerships' ? 'people-outline' :
          activeTab === 'browse' ? 'search-outline' : 'folder-open-outline'
        } 
        size={64} 
        color="#E0E0E0" 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'partnerships' ? 'No partnerships yet' :
         activeTab === 'browse' ? 'No organizations found' :
         'No content yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'partnerships' ? 
          'Create content and invite partners to collaborate' :
          activeTab === 'browse' ?
          'Try searching with different keywords' :
          'Create events or projects to share with partners'}
      </Text>
      
      {/* ✅ CENTERED CREATE CONTENT BUTTON */}
      {(activeTab === 'partnerships' || activeTab === 'content') && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.emptyButtonText}>Create Content</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!bodyId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* HEADER with Create Button */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Partnerships</Text>
          <Text style={styles.headerSubtitle}>Collaborate & Grow Together</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={28} color="#1A73E8" />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={tabs}
          renderItem={renderTab}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsList}
        />
      </View>

      {/* FILTERS */}
      {activeTab === 'partnerships' && (
        <View style={styles.filtersSection}>
          <FlatList
            horizontal
            data={filters}
            renderItem={renderFilter}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>
      )}

      {/* SEARCH */}
      {activeTab === 'browse' && (
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search organizations..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length > 2) loadAvailableBodies();
              }}
            />
          </View>
        </View>
      )}

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      ) : (
        <FlatList
          data={
            activeTab === 'partnerships' ? partnerships :
            activeTab === 'browse' ? availableBodies :
            myContent
          }
          renderItem={
            activeTab === 'partnerships' ? renderPartnership :
            activeTab === 'browse' ? renderAvailableBody :
            renderContentItem
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#1A73E8']}
              tintColor="#1A73E8"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {renderCreateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#5F6368',
  },
  headerButton: {
    padding: 4,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#1A73E8',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -13,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: '#1A73E8',
    borderRadius: 2,
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardTop: {
    padding: 16,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#1A73E8',
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inviteButton: {
    padding: 16,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ✅ UPDATED: Empty state matching Body Posts screen
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5F6368',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5F6368',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default BodyPartnershipsScreen;
