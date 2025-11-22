import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { BodyService } from '../../utils/bodyService';

const BodyPetitionsScreen = ({ route, navigation }) => {
  // Get bodyId from route or current user
  const [bodyId, setBodyId] = useState(route.params?.bodyId);
  const [petitions, setPetitions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'in_review', label: 'In Review', icon: '🔍' },
    { value: 'responded', label: 'Responded', icon: '✅' },
  ];

  useEffect(() => {
    initializeBodyId();
  }, []);

  useEffect(() => {
    if (bodyId) {
      loadPetitions();
    }
  }, [bodyId, filter]);

  const initializeBodyId = async () => {
    if (!bodyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setBodyId(user.id);
      }
    }
  };

  const loadPetitions = async () => {
    try {
      const result = await BodyService.getBodyPetitions(bodyId);
      if (result.success) {
        setPetitions(result.petitions || []);
      }
    } catch (error) {
      console.error('Error loading petitions:', error);
      Alert.alert('Error', 'Failed to load petitions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPetitions();
  };

  const handlePetitionPress = (petition) => {
    // Navigate to petition detail where body can respond
    navigation.navigate('PetitionDetailEnhanced', {
      petitionId: petition.petition_id || petition.id,
      bodyId,
    });
  };

  const getFilteredPetitions = () => {
    if (filter === 'all') return petitions;
    if (filter === 'pending') {
      return petitions.filter((p) => !p.response_status || p.response_status === 'pending');
    }
    if (filter === 'in_review') {
      return petitions.filter((p) => p.response_status === 'in_review');
    }
    if (filter === 'responded') {
      return petitions.filter(
        (p) => p.response_status === 'responded' || p.response_status === 'actioned'
      );
    }
    return petitions;
  };

  const getStatusInfo = (petition) => {
    if (petition.response_status === 'responded' || petition.response_status === 'actioned') {
      return { label: '✅ Responded', color: '#E8F5E9', textColor: '#2E7D32' };
    }
    if (petition.response_status === 'in_review') {
      return { label: '🔍 In Review', color: '#E3F2FD', textColor: '#1976D2' };
    }
    return { label: '⏳ Pending', color: '#FFF3E0', textColor: '#F57C00' };
  };

  const getCreatorName = (petition) => {
    if (petition.petition?.is_anonymous) {
      return '🔒 Anonymous Petitioner';
    }
    return petition.petition?.creator?.full_name || petition.creator?.full_name || 'Unknown';
  };

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
      onPress={() => setFilter(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderPetition = ({ item }) => {
    const statusInfo = getStatusInfo(item);
    const creatorName = getCreatorName(item);
    const petition = item.petition || item;

    return (
      <TouchableOpacity
        style={styles.petitionCard}
        onPress={() => handlePetitionPress(item)}
        activeOpacity={0.7}
      >
        {/* Status and Anonymous Badges */}
        <View style={styles.petitionHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
              {statusInfo.label}
            </Text>
          </View>
          {petition.is_anonymous && (
            <View style={styles.anonymousBadge}>
              <Text style={styles.anonymousBadgeText}>🔒 Anonymous</Text>
            </View>
          )}
        </View>

        {/* Petition Content */}
        <Text style={styles.petitionTitle} numberOfLines={2}>
          {petition.title}
        </Text>

        <Text style={styles.petitionDescription} numberOfLines={3}>
          {petition.description}
        </Text>

        {/* Stats */}
        <View style={styles.petitionFooter}>
          <View style={styles.petitionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👍</Text>
              <Text style={styles.statValue}>{petition.votes_for || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👎</Text>
              <Text style={styles.statValue}>{petition.votes_against || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{petition.support_count || 0}</Text>
            </View>
          </View>
          <Text style={styles.petitionDate}>
            {new Date(petition.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Creator and Category */}
        <View style={styles.creatorInfo}>
          <View style={styles.creatorSection}>
            {petition.creator?.avatar_url && !petition.is_anonymous ? (
              <Image source={{ uri: petition.creator.avatar_url }} style={styles.creatorAvatar} />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorAvatarText}>
                  {petition.is_anonymous ? '🔒' : creatorName[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.creatorText} numberOfLines={1}>
              {creatorName}
            </Text>
          </View>
          {petition.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {petition.category.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Response indicator if exists */}
        {item.response_date && (
          <View style={styles.responseIndicator}>
            <Text style={styles.responseText}>
              📝 Responded on {new Date(item.response_date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredPetitions = getFilteredPetitions();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading petitions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9800" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Petitions</Text>
        <Text style={styles.headerSubtitle}>
          {filteredPetitions.length} {filteredPetitions.length === 1 ? 'petition' : 'petitions'}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          renderItem={renderFilter}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={filteredPetitions}
        renderItem={renderPetition}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No petitions yet' : `No ${filter} petitions`}
            </Text>
            <Text style={styles.emptySubtext}>
              Petitions directed at your organization will appear here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FF9800',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF3E0',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FF9800',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  petitionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  anonymousBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  anonymousBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  petitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  petitionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  petitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  petitionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  petitionDate: {
    fontSize: 12,
    color: '#999999',
  },
  creatorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  creatorAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  creatorText: {
    fontSize: 13,
    color: '#999999',
    flex: 1,
  },
  categoryTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2196F3',
  },
  responseIndicator: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  responseText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BodyPetitionsScreen;
