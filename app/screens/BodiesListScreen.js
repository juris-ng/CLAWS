// screens/body/BodiesListScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
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

const BodiesListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [allBodies, setAllBodies] = useState([]);
  const [myBodiesData, setMyBodiesData] = useState([]);
  const [filteredBodies, setFilteredBodies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [myBodiesIds, setMyBodiesIds] = useState(new Set());
  const [showExploreMode, setShowExploreMode] = useState(false);

  const categories = [
    { id: 'All', label: 'All', icon: 'apps-outline' },
    { id: 'government', label: 'Government', icon: 'business-outline' },
    { id: 'ngo', label: 'NGO', icon: 'heart-outline' },
    { id: 'civil_society', label: 'Civil', icon: 'people-outline' },
    { id: 'community', label: 'Community', icon: 'home-outline' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterBodies();
  }, [searchQuery, selectedCategory, allBodies, myBodiesData, showExploreMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchAllBodies(), fetchMyBodies()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllBodies = async () => {
    try {
      const { data, error } = await supabase
        .from('bodies')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;
      setAllBodies(data || []);
    } catch (error) {
      console.error('Error fetching all bodies:', error);
      Alert.alert('Error', 'Failed to load organizations');
    }
  };

  const fetchMyBodies = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('body_members')
        .select(`
          *,
          bodies:body_id (*)
        `)
        .eq('member_id', user.id);

      if (error) throw error;

      const bodyIds = new Set(data.map((m) => m.body_id));
      const bodiesData = data.map((m) => m.bodies).filter((b) => b !== null);
      
      setMyBodiesIds(bodyIds);
      setMyBodiesData(bodiesData);
    } catch (error) {
      console.error('Error fetching my bodies:', error);
    }
  };

  const filterBodies = () => {
    const sourceList = showExploreMode || myBodiesIds.size === 0 
      ? allBodies.filter((body) => !myBodiesIds.has(body.id))
      : myBodiesData;

    let filtered = sourceList;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((body) => body.body_type === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (body) =>
          body.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          body.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBodies(filtered);
  };

  const handleJoinBody = async (bodyId) => {
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in to join an organization');
      return;
    }

    try {
      const { error } = await supabase.from('body_members').insert({
        body_id: bodyId,
        member_id: user.id,
        role: 'member',
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Joined', 'You are already a member of this organization');
        } else {
          throw error;
        }
        return;
      }

      Alert.alert('Success', 'Successfully joined organization! 🎉');

      const body = allBodies.find((b) => b.id === bodyId);
      await supabase
        .from('bodies')
        .update({ member_count: (body?.member_count || 0) + 1 })
        .eq('id', bodyId);

      await fetchData();
      setShowExploreMode(false);
    } catch (error) {
      console.error('Error joining body:', error);
      Alert.alert('Error', 'Failed to join organization. Please try again.');
    }
  };

  const handleLeaveBody = async (bodyId, bodyName) => {
    Alert.alert(
      'Leave Organization',
      `Are you sure you want to leave ${bodyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('body_members')
                .delete()
                .eq('body_id', bodyId)
                .eq('member_id', user.id);

              if (error) throw error;

              Alert.alert('Success', 'Left organization successfully');

              const body = allBodies.find((b) => b.id === bodyId);
              await supabase
                .from('bodies')
                .update({ member_count: Math.max(0, (body?.member_count || 1) - 1) })
                .eq('id', bodyId);

              fetchData();
            } catch (error) {
              console.error('Error leaving body:', error);
              Alert.alert('Error', 'Failed to leave organization');
            }
          },
        },
      ]
    );
  };

  const renderMyBodyCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BodyChat', { bodyId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.bodyAvatar}>
            <Text style={styles.bodyAvatarText}>
              {item.name?.charAt(0).toUpperCase() || 'O'}
            </Text>
          </View>

          <View style={styles.bodyInfo}>
            <Text style={styles.bodyName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.bodyDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Ionicons name="people" size={12} color={COLORS.primary} />
                <Text style={styles.statText}>{item.member_count || 0}</Text>
              </View>
              {item.body_type && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>
                    {item.body_type.replace('_', ' ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert(item.name, 'Choose an action', [
                {
                  text: 'View',
                  onPress: () => navigation.navigate('BodyChat', { bodyId: item.id }),
                },
                {
                  text: 'Leave',
                  style: 'destructive',
                  onPress: () => handleLeaveBody(item.id, item.name),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExploreBodyCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleJoinBody(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.bodyAvatar}>
            <Text style={styles.bodyAvatarText}>
              {item.name?.charAt(0).toUpperCase() || 'O'}
            </Text>
          </View>

          <View style={styles.bodyInfo}>
            <Text style={styles.bodyName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.bodyDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Ionicons name="people" size={12} color={COLORS.primary} />
                <Text style={styles.statText}>{item.member_count || 0}</Text>
              </View>
              {item.body_type && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>
                    {item.body_type.replace('_', ' ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={(e) => {
              e.stopPropagation();
              handleJoinBody(item.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={showExploreMode || myBodiesIds.size === 0 ? "search-outline" : "business-outline"} 
        size={64} 
        color={COLORS.lightGray} 
      />
      <Text style={styles.emptyTitle}>
        {showExploreMode || myBodiesIds.size === 0
          ? searchQuery
            ? 'No organizations found'
            : 'No organizations available'
          : "You haven't joined any organizations yet"}
      </Text>
      <Text style={styles.emptySubtext}>
        {showExploreMode || myBodiesIds.size === 0
          ? searchQuery
            ? 'Try adjusting your search or filters'
            : 'Check back later for new organizations'
          : 'Tap "Explore" to find organizations to join'}
      </Text>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading organizations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExploreMode = showExploreMode || myBodiesIds.size === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* CLEAN WHITE HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {isExploreMode && myBodiesIds.size > 0 && (
              <TouchableOpacity
                onPress={() => setShowExploreMode(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {isExploreMode ? 'Explore' : 'Organizations'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isExploreMode
                  ? `${filteredBodies.length} available`
                  : `${myBodiesData.length} joined`}
              </Text>
            </View>
            {!isExploreMode && (
              <TouchableOpacity
                onPress={() => setShowExploreMode(true)}
                style={styles.exploreButton}
              >
                <Ionicons name="add-circle" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={COLORS.mediumGray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search organizations..."
              placeholderTextColor={COLORS.mediumGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon}
                  size={16}
                  color={selectedCategory === category.id ? COLORS.primary : COLORS.mediumGray}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bodies List */}
        <FlatList
          data={filteredBodies}
          renderItem={isExploreMode ? renderExploreBodyCard : renderMyBodyCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      </View>
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

  // CLEAN WHITE HEADER
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  exploreButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
    padding: 0,
  },

  // Categories
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.veryLightGray,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: 16,
  },

  // Card Design
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  bodyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyAvatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  bodyInfo: {
    flex: 1,
  },
  bodyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  bodyDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  typeBadge: {
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textTransform: 'capitalize',
  },
  joinButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  moreButton: {
    padding: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BodiesListScreen;
