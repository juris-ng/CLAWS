import React, { useEffect, useState } from 'react';
import {
  FlatList, ScrollView, StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SearchService } from '../../utils/searchService';
import PetitionDetailEnhanced from './PetitionDetailEnhanced';

export default function SearchScreen({ user, profile, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, selectedCategory]);

  const loadInitialData = async () => {
    const cats = await SearchService.getCategories();
    const trending = await SearchService.getTrendingTopics();
    setCategories(cats);
    setTrendingTopics(trending);
  };

  const performSearch = async () => {
    setLoading(true);
    const results = await SearchService.searchPetitions(searchQuery, {
      category: selectedCategory,
      status: 'active',
      sortBy: 'recent'
    });
    setSearchResults(results);
    setLoading(false);
  };

  if (selectedPetition) {
    return (
      <PetitionDetailEnhanced
        petition={selectedPetition}
        user={user}
        profile={profile}
        onBack={() => setSelectedPetition(null)}
      />
    );
  }

  const renderPetition = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => setSelectedPetition(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.categoryBadge}>
          {categories.find(c => c.id === item.category)?.icon || '📋'}
        </Text>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      <Text style={styles.resultDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.resultFooter}>
        <Text style={styles.resultStat}>👍 {item.votes?.[0]?.count || 0}</Text>
        <Text style={styles.resultStat}>💬 {item.comments?.[0]?.count || 0}</Text>
        <Text style={styles.resultDate}>
          {new Date(item.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrending = ({ item }) => (
    <TouchableOpacity
      style={styles.trendingCard}
      onPress={() => setSelectedPetition(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.trendingVotes}>🔥 {item.votes?.[0]?.count || 0}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIconLeft}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search petitions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryPillText, !selectedCategory && styles.categoryPillTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryPillText, selectedCategory === cat.id && styles.categoryPillTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.trim() === '' ? (
          <>
            {/* Trending Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
              <FlatList
                horizontal
                data={trendingTopics}
                renderItem={renderTrending}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingList}
              />
            </View>

            {/* Categories Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📂 Browse Categories</Text>
              <View style={styles.categoriesGrid}>
                {categories.slice(0, 6).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => {
                      setSelectedCategory(category.id);
                      setSearchQuery('Browse');
                    }}
                  >
                    <Text style={styles.categoryCardIcon}>{category.icon}</Text>
                    <Text style={styles.categoryCardName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Search Results */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {loading ? 'Searching...' : `${searchResults.length} Results`}
              </Text>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderPetition}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptyText}>Try different keywords</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1C1C1E',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIconLeft: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },
  clearIcon: {
    fontSize: 20,
    color: '#8E8E93',
    paddingHorizontal: 8,
  },
  categoriesScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  categoryPillActive: {
    backgroundColor: '#0066FF',
  },
  categoryPillIcon: {
    fontSize: 14,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1C1C1E',
  },
  trendingList: {
    gap: 12,
  },
  trendingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: 180,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  trendingVotes: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '31%',
    margin: '1%',
    alignItems: 'center',
  },
  categoryCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryCardName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#3C3C43',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 20,
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
    color: '#1C1C1E',
  },
  resultDescription: {
    fontSize: 13,
    color: '#3C3C43',
    lineHeight: 18,
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  resultStat: {
    fontSize: 12,
    color: '#8E8E93',
  },
  resultDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
