import React, { useEffect, useState } from 'react';
import {
  FlatList, RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';

export default function DiscoverScreen({ user, profile }) {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const filters = ['All', 'Bodies', 'Petitions', 'Members', 'Lawyers'];

  useEffect(() => {
    loadResults();
  }, [activeFilter]);

  const loadResults = async () => {
    setLoading(true);

    if (activeFilter === 'All' || activeFilter === 'Bodies') {
      const { data: bodies } = await supabase
        .from('bodies')
        .select('*')
        .order('member_count', { ascending: false })
        .limit(10);
      
      if (bodies) {
        setResults(prev => [...prev, ...bodies.map(b => ({ ...b, type: 'body' }))]);
      }
    }

    if (activeFilter === 'All' || activeFilter === 'Petitions') {
      const { data: petitions } = await supabase
        .from('petitions')
        .select('*')
        .order('upvotes', { ascending: false })
        .limit(10);
      
      if (petitions) {
        setResults(prev => [...prev, ...petitions.map(p => ({ ...p, type: 'petition' }))]);
      }
    }

    if (activeFilter === 'All' || activeFilter === 'Members') {
      const { data: members } = await supabase
        .from('members')
        .select('*')
        .order('points', { ascending: false })
        .limit(10);
      
      if (members) {
        setResults(prev => [...prev, ...members.map(m => ({ ...m, type: 'member' }))]);
      }
    }

    if (activeFilter === 'All' || activeFilter === 'Lawyers') {
      const { data: lawyers } = await supabase
        .from('lawyers')
        .select('*')
        .order('points', { ascending: false })
        .limit(10);
      
      if (lawyers) {
        setResults(prev => [...prev, ...lawyers.map(l => ({ ...l, type: 'lawyer' }))]);
      }
    }

    setLoading(false);
  };

  const renderItem = ({ item }) => {
    if (item.type === 'body') {
      return (
        <TouchableOpacity style={styles.resultCard}>
          <View style={styles.resultIcon}>
            <Text style={styles.resultIconText}>🏢</Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{item.name}</Text>
            <Text style={styles.resultSubtitle}>
              A dedicated group working for sustainable local
            </Text>
            <View style={styles.resultMeta}>
              <Text style={styles.metaText}>👥 {item.member_count} Members</Text>
              <Text style={styles.metaStatus}>• Active</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Join</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    if (item.type === 'petition') {
      return (
        <TouchableOpacity style={styles.resultCard}>
          <View style={[styles.resultIcon, { backgroundColor: '#34C759' }]}>
            <Text style={styles.resultIconText}>📋</Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSubtitle} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.resultMeta}>
              <Text style={styles.metaText}>🌱 {item.upvotes} Supporters</Text>
              <Text style={styles.metaStatus}>• Ongoing</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.actionButton, styles.supportButton]}>
            <Text style={styles.actionButtonText}>⚡ Support</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    if (item.type === 'member') {
      return (
        <TouchableOpacity style={styles.resultCard}>
          <View style={styles.resultAvatar}>
            <Text style={styles.avatarText}>
              {item.full_name?.charAt(0).toUpperCase() || 'M'}
            </Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{item.full_name}</Text>
            <Text style={styles.resultSubtitle}>
              Advocating for digital rights and ethical AI
            </Text>
            <View style={styles.resultMeta}>
              <Text style={styles.metaText}>⚖️ Legal Scholar</Text>
              <Text style={styles.metaStatus}>• Member since 2022</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.actionButton, styles.inviteButton]}>
            <Text style={styles.actionButtonText}>✉️ Invite</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    if (item.type === 'lawyer') {
      return (
        <TouchableOpacity style={styles.resultCard}>
          <View style={[styles.resultIcon, { backgroundColor: '#AF52DE' }]}>
            <Text style={styles.resultIconText}>⚖️</Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{item.full_name}</Text>
            <Text style={styles.resultSubtitle}>
              Providing pro-bono legal services for
            </Text>
            <View style={styles.resultMeta}>
              <Text style={styles.metaText}>💼 5 Lawyers</Text>
              <Text style={styles.metaStatus}>• 20+ Cases</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.actionButton, styles.referButton]}>
            <Text style={styles.actionButtonText}>🔗 Refer</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search MAU2..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive
            ]}
            onPress={() => {
              setActiveFilter(filter);
              setResults([]);
            }}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter && styles.filterTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
        contentContainerStyle={styles.resultsContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadResults} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.loadMore}>
            <Text style={styles.loadMoreText}>Load More Results</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resultIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultIconText: {
    fontSize: 24,
  },
  resultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultContent: {
    flex: 1,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  metaStatus: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0066FF',
  },
  supportButton: {
    backgroundColor: '#FF9500',
  },
  inviteButton: {
    backgroundColor: '#8E8E93',
  },
  referButton: {
    backgroundColor: '#AF52DE',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C3C43',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loadMore: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  loadMoreText: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '600',
  },
});
