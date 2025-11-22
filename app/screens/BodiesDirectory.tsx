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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { BodyService } from '../../utils/bodyService';

export default function BodiesDirectory({ user, onBack, navigation }) {
  const [bodies, setBodies] = useState([]);
  const [filteredBodies, setFilteredBodies] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myMemberships, setMyMemberships] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  const bodyTypes = [
    { value: 'all', label: 'All', icon: '🏢' },
    { value: 'government', label: 'Government', icon: '🏛️' },
    { value: 'ngo', label: 'NGO', icon: '🤝' },
    { value: 'civil_society', label: 'Civil Society', icon: '👥' },
  ];

  useEffect(() => {
    loadBodies();
    loadMyMemberships();
  }, []);

  useEffect(() => {
    filterBodies();
  }, [searchText, selectedType, bodies]);

  const loadBodies = async () => {
    try {
      const result = await BodyService.getAllBodies();
      if (result.success) {
        setBodies(result.bodies || []);
      } else {
        Alert.alert('Error', result.error || 'Failed to load organizations');
      }
    } catch (error) {
      console.error('Error loading bodies:', error);
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('body_memberships')
        .select('body_id')
        .eq('member_id', user.id);

      if (data) {
        const membershipIds = data.map((m) => m.body_id);
        setMyMemberships(membershipIds);
      }
    } catch (error) {
      console.error('Error loading memberships:', error);
    }
  };

  const filterBodies = () => {
    let filtered = [...bodies];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((body) => body.body_type === selectedType);
    }

    // Filter by search
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (body) =>
          body.name?.toLowerCase().includes(searchLower) ||
          body.description?.toLowerCase().includes(searchLower) ||
          body.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBodies(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBodies();
    loadMyMemberships();
  };

  const handleJoinBody = async (bodyId, bodyName) => {
    if (myMemberships.includes(bodyId)) {
      Alert.alert('Already a Member', 'You are already a member of this organization');
      return;
    }

    Alert.alert('Join Organization', `Would you like to join ${bodyName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Join',
        onPress: async () => {
          try {
            const { error } = await supabase.from('body_memberships').insert([
              {
                member_id: user.id,
                body_id: bodyId,
                role: 'member',
                status: 'active',
              },
            ]);

            if (error) {
              Alert.alert('Error', 'Failed to join: ' + error.message);
              return;
            }

            // Update followers count
            await supabase.rpc('increment_body_followers', { body_id: bodyId });

            Alert.alert('Success! 🎉', 'You have joined the organization');
            loadMyMemberships();
            loadBodies();
          } catch (error) {
            Alert.alert('Error', 'Failed to join organization');
          }
        },
      },
    ]);
  };

  const handleLeaveBody = async (bodyId, bodyName) => {
    Alert.alert('Leave Organization', `Are you sure you want to leave ${bodyName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('body_memberships')
              .delete()
              .eq('member_id', user.id)
              .eq('body_id', bodyId);

            if (error) {
              Alert.alert('Error', 'Failed to leave: ' + error.message);
              return;
            }

            // Update followers count
            await supabase.rpc('decrement_body_followers', { body_id: bodyId });

            Alert.alert('Success', 'You have left the organization');
            loadMyMemberships();
            loadBodies();
          } catch (error) {
            Alert.alert('Error', 'Failed to leave organization');
          }
        },
      },
    ]);
  };

  const handleBodyPress = (body) => {
    if (navigation) {
      navigation.navigate('BodyProfile', { bodyId: body.id });
    }
  };

  const renderTypeFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, selectedType === item.value && styles.filterChipActive]}
      onPress={() => setSelectedType(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[styles.filterText, selectedType === item.value && styles.filterTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderBody = ({ item }) => {
    const isMember = myMemberships.includes(item.id);
    const typeInfo = bodyTypes.find((t) => t.value === item.body_type);

    return (
      <TouchableOpacity
        style={styles.bodyCard}
        onPress={() => handleBodyPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.bodyHeader}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.bodyInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.bodyName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeIcon}>{typeInfo?.icon || '🏢'}</Text>
              <Text style={styles.bodyType}>{typeInfo?.label || item.body_type}</Text>
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={styles.bodyDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.location && (
          <Text style={styles.bodyLocation}>📍 {item.location}</Text>
        )}

        <View style={styles.bodyFooter}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statText}>{item.followers_count || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📝</Text>
              <Text style={styles.statText}>{item.posts_count || 0}</Text>
            </View>
            {item.points > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statText}>{item.points || 0}</Text>
              </View>
            )}
          </View>

          {isMember ? (
            <View style={styles.actionButtons}>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>✓ Member</Text>
              </View>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => handleLeaveBody(item.id, item.name)}
              >
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinBody(item.id, item.name)}
            >
              <Text style={styles.joinButtonText}>+ Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#28a745" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading organizations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#28a745" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Organizations</Text>
            <Text style={styles.headerSubtitle}>
              {filteredBodies.length} {filteredBodies.length === 1 ? 'organization' : 'organizations'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search organizations..."
              placeholderTextColor="#999999"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Type Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={bodyTypes}
            renderItem={renderTypeFilter}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        {/* Bodies List */}
        <FlatList
          data={filteredBodies}
          renderItem={renderBody}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyText}>
                {searchText
                  ? 'No organizations found'
                  : selectedType === 'all'
                  ? 'No organizations yet'
                  : `No ${bodyTypes.find((t) => t.value === selectedType)?.label} organizations`}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchText
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new organizations'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#28a745',
    padding: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#E8F5E9',
    fontSize: 14,
  },
  searchContainer: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearIcon: {
    fontSize: 20,
    color: '#999',
    paddingHorizontal: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
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
    backgroundColor: '#28a745',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  bodyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  bodyInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bodyName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedIcon: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  bodyType: {
    fontSize: 13,
    color: '#666',
  },
  bodyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  bodyLocation: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  bodyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  stats: {
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
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  joinButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  leaveButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
