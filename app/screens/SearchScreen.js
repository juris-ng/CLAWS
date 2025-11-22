import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { CATEGORIES, SearchService } from '../../utils/searchService';
import PetitionDetailEnhanced from './PetitionDetailEnhanced';

export default function SearchScreen({ navigation }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [bodyResults, setBodyResults] = useState([]);
  const [lawyerResults, setLawyerResults] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchType, setSearchType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
        loadSuggestions();
      } else {
        setSearchResults([]);
        setBodyResults([]);
        setLawyerResults([]);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, selectedCategory, searchType, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [trending, recent] = await Promise.all([
        SearchService.getTrendingTopics(10),
        user ? SearchService.getUserSearchHistory(user.id, 10) : { success: true, history: [] },
      ]);

      if (trending.success) {
        setTrendingTopics(trending.trending);
      }

      if (recent.success && recent.history) {
        setRecentSearches(recent.history);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    const result = await SearchService.getSearchSuggestions(searchQuery, searchType);
    if (result.success) {
      setSuggestions(result.suggestions);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);

      if (searchType === 'all') {
        // Search all types
        const [petitions, bodies, lawyers] = await Promise.all([
          SearchService.searchPetitions(searchQuery, {
            category: selectedCategory,
            sortBy,
            limit: 20,
          }),
          SearchService.searchBodies(searchQuery, { limit: 10 }),
          SearchService.searchLawyers(searchQuery, { limit: 10 }),
        ]);

        if (petitions.success) setSearchResults(petitions.petitions);
        if (bodies.success) setBodyResults(bodies.bodies);
        if (lawyers.success) setLawyerResults(lawyers.lawyers);
      } else if (searchType === 'petitions') {
        const result = await SearchService.searchPetitions(searchQuery, {
          category: selectedCategory,
          sortBy,
          limit: 50,
        });
        if (result.success) setSearchResults(result.petitions);
      } else if (searchType === 'bodies') {
        const result = await SearchService.searchBodies(searchQuery, { limit: 50 });
        if (result.success) setBodyResults(result.bodies);
      } else if (searchType === 'lawyers') {
        const result = await SearchService.searchLawyers(searchQuery, { limit: 50 });
        if (result.success) setLawyerResults(result.lawyers);
      }

      // Save search to history
      if (user && searchQuery.trim()) {
        await SearchService.saveSearchHistory(searchQuery, user.id);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
    if (searchQuery.trim()) {
      performSearch();
    }
    setRefreshing(false);
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion);
  };

  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
  };

  const handleClearHistory = async () => {
    if (user) {
      await SearchService.clearSearchHistory(user.id);
      setRecentSearches([]);
    }
  };

  const renderPetitionCard = ({ item }) => {
    const category = CATEGORIES.find((c) => c.id === item.category);
    const signatureCount = item.signatures?.[0]?.count || 0;
    const commentCount = item.comments?.[0]?.count || 0;

    return (
      <TouchableOpacity
        style={styles.petitionCard}
        onPress={() => setSelectedPetition(item)}
        activeOpacity={0.7}
      >
        {category && (
          <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[styles.categoryText, { color: category.color }]}>
              {category.name}
            </Text>
          </View>
        )}

        <Text style={styles.petitionTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.petitionDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.petitionFooter}>
          <View style={styles.petitionStat}>
            <Text style={styles.petitionStatIcon}>✍️</Text>
            <Text style={styles.petitionStatText}>{signatureCount}</Text>
          </View>
          <View style={styles.petitionStat}>
            <Text style={styles.petitionStatIcon}>💬</Text>
            <Text style={styles.petitionStatText}>{commentCount}</Text>
          </View>
          <Text style={styles.petitionDate}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBodyCard = ({ item }) => (
    <TouchableOpacity
      style={styles.bodyCard}
      onPress={() => navigation.navigate('BodyDashboard', { bodyId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.bodyHeader}>
        <View style={styles.bodyIconContainer}>
          <Text style={styles.bodyIcon}>🏢</Text>
        </View>
        <View style={styles.bodyInfo}>
          <Text style={styles.bodyName} numberOfLines={1}>
            {item.organization_name}
          </Text>
          <Text style={styles.bodyLocation} numberOfLines={1}>
            📍 {item.location || 'No location'}
          </Text>
        </View>
        {item.is_verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}
      </View>

      <Text style={styles.bodyDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.bodyFooter}>
        <View style={styles.bodyStat}>
          <Text style={styles.bodyStatIcon}>👥</Text>
          <Text style={styles.bodyStatText}>{item.member_count || 0}</Text>
        </View>
        <View style={styles.bodyStat}>
          <Text style={styles.bodyStatIcon}>⭐</Text>
          <Text style={styles.bodyStatText}>
            {item.rating ? item.rating.toFixed(1) : 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLawyerCard = ({ item }) => (
    <TouchableOpacity
      style={styles.lawyerCard}
      onPress={() => navigation.navigate('LawyerProfile', { lawyerId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.lawyerHeader}>
        <View style={styles.lawyerAvatar}>
          <Text style={styles.lawyerAvatarText}>
            {item.member?.full_name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.lawyerInfo}>
          <Text style={styles.lawyerName} numberOfLines={1}>
            {item.member?.full_name || 'Unknown'}
          </Text>
          <Text style={styles.lawyerBar} numberOfLines={1}>
            Bar: {item.bar_number}
          </Text>
        </View>
        {item.is_verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}
      </View>

      {item.specializations && (
        <View style={styles.specializationsContainer}>
          {item.specializations.slice(0, 3).map((spec, index) => (
            <View key={index} style={styles.specializationChip}>
              <Text style={styles.specializationText}>{spec}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTrendingCard = ({ item }) => (
    <TouchableOpacity
      style={styles.trendingCard}
      onPress={() => setSelectedPetition(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.trendingTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.trendingCount}>🔥 {item.signature_count || 0}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      {/* Search Type Tabs */}
      <View style={styles.searchTypeContainer}>
        {[
          { id: 'all', label: 'All', icon: '🔍' },
          { id: 'petitions', label: 'Petitions', icon: '📋' },
          { id: 'bodies', label: 'Organizations', icon: '🏢' },
          { id: 'lawyers', label: 'Lawyers', icon: '⚖️' },
        ].map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.searchTypeButton,
              searchType === type.id && styles.searchTypeButtonActive,
            ]}
            onPress={() => setSearchType(type.id)}
          >
            <Text
              style={[
                styles.searchTypeText,
                searchType === type.id && styles.searchTypeTextActive,
              ]}
            >
              {type.icon} {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort & Filter Bar (only for petitions) */}
      {(searchType === 'all' || searchType === 'petitions') && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <Text style={styles.filterLabel}>Sort:</Text>
            {[
              { id: 'recent', label: 'Recent', icon: '🕒' },
              { id: 'popular', label: 'Popular', icon: '🔥' },
              { id: 'alphabetical', label: 'A-Z', icon: '🔤' },
            ].map((sort) => (
              <TouchableOpacity
                key={sort.id}
                style={[
                  styles.filterChip,
                  sortBy === sort.id && styles.filterChipActive,
                ]}
                onPress={() => setSortBy(sort.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sortBy === sort.id && styles.filterChipTextActive,
                  ]}
                >
                  {sort.icon} {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories (only for petitions) */}
      {(searchType === 'all' || searchType === 'petitions') && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              !selectedCategory && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryPillText,
                !selectedCategory && styles.categoryPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );

  const renderSearchContent = () => {
    if (searchQuery.trim() === '') {
      // Show discover content
      return (
        <>
          {/* Trending Section */}
          {trendingTopics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
              <FlatList
                horizontal
                data={trendingTopics}
                renderItem={renderTrendingCard}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🕒 Recent Searches</Text>
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearButton}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentSearches}>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchChip}
                    onPress={() => handleRecentSearchPress(search.query)}
                  >
                    <Text style={styles.recentSearchText}>{search.query}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Categories Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📂 Browse Categories</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.slice(0, 6).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setSearchQuery(category.name);
                  }}
                >
                  <Text style={styles.categoryCardIcon}>{category.icon}</Text>
                  <Text style={styles.categoryCardName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      );
    }

    // Show search results
    return (
      <>
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionIcon}>🔍</Text>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Results */}
        {searchType === 'all' && (
          <>
            {searchResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📋 Petitions ({searchResults.length})
                </Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderPetitionCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {bodyResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🏢 Organizations ({bodyResults.length})
                </Text>
                <FlatList
                  data={bodyResults}
                  renderItem={renderBodyCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {lawyerResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  ⚖️ Lawyers ({lawyerResults.length})
                </Text>
                <FlatList
                  data={lawyerResults}
                  renderItem={renderLawyerCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}
          </>
        )}

        {searchType === 'petitions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {loading
                ? 'Searching...'
                : `${searchResults.length} Petition${
                    searchResults.length !== 1 ? 's' : ''
                  }`}
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderPetitionCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                !loading && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>No petitions found</Text>
                    <Text style={styles.emptyText}>Try different keywords</Text>
                  </View>
                )
              }
            />
          </View>
        )}

        {searchType === 'bodies' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {loading
                ? 'Searching...'
                : `${bodyResults.length} Organization${
                    bodyResults.length !== 1 ? 's' : ''
                  }`}
            </Text>
            <FlatList
              data={bodyResults}
              renderItem={renderBodyCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                !loading && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🏢</Text>
                    <Text style={styles.emptyTitle}>No organizations found</Text>
                    <Text style={styles.emptyText}>Try different keywords</Text>
                  </View>
                )
              }
            />
          </View>
        )}

        {searchType === 'lawyers' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {loading
                ? 'Searching...'
                : `${lawyerResults.length} Lawyer${
                    lawyerResults.length !== 1 ? 's' : ''
                  }`}
            </Text>
            <FlatList
              data={lawyerResults}
              renderItem={renderLawyerCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                !loading && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>⚖️</Text>
                    <Text style={styles.emptyTitle}>No lawyers found</Text>
                    <Text style={styles.emptyText}>Try different keywords</Text>
                  </View>
                )
              }
            />
          </View>
        )}
      </>
    );
  };

  if (selectedPetition) {
    return (
      <PetitionDetailEnhanced
        petition={selectedPetition}
        onClose={() => setSelectedPetition(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header with Search */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIconLeft}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search petitions, organizations, lawyers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066FF']}
              tintColor="#0066FF"
            />
          }
          ListHeaderComponent={renderHeader}
        >
          {renderSearchContent()}
        </ScrollView>

        {/* Loading Overlay */}
        {loading && searchQuery.trim() !== '' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066FF" />
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIconLeft: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  clearIcon: {
    fontSize: 24,
    color: '#999999',
    paddingHorizontal: 8,
  },

  // Search Type Tabs
  searchTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  searchTypeButtonActive: {
    backgroundColor: '#0066FF',
  },
  searchTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  searchTypeTextActive: {
    color: '#FFFFFF',
  },

  // Filter Bar
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginRight: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Categories
  categoriesScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryPillActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  categoryPillIcon: {
    fontSize: 14,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  suggestionIcon: {
    fontSize: 16,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333333',
  },

  // Recent Searches
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentSearchChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recentSearchText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },

  // Trending
  horizontalList: {
    gap: 12,
  },
  trendingCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    width: 160,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
    color: '#333333',
  },
  trendingCount: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },

  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryCardName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333333',
  },

  // Petition Card
  petitionCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  petitionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
    lineHeight: 22,
  },
  petitionDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 10,
  },
  petitionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  petitionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  petitionStatIcon: {
    fontSize: 14,
  },
  petitionStatText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  petitionDate: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 'auto',
  },

  // Body Card
  bodyCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bodyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bodyIcon: {
    fontSize: 22,
  },
  bodyInfo: {
    flex: 1,
  },
  bodyName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  bodyLocation: {
    fontSize: 12,
    color: '#999999',
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bodyDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 10,
  },
  bodyFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  bodyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bodyStatIcon: {
    fontSize: 14,
  },
  bodyStatText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },

  // Lawyer Card
  lawyerCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lawyerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lawyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lawyerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lawyerInfo: {
    flex: 1,
  },
  lawyerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  lawyerBar: {
    fontSize: 12,
    color: '#999999',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specializationChip: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specializationText: {
    fontSize: 11,
    color: '#9C27B0',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
