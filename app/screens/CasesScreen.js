import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';

export default function CasesScreen({ user, profile }) {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const filters = ['all', 'pending', 'approved', 'rejected', 'under_review'];

  useEffect(() => {
    loadPetitions();
  }, [filter]);

  const loadPetitions = async () => {
    setLoading(true);
    
    let query = supabase
      .from('petitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    
    if (data) {
      setPetitions(data);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'under_review': return '#FF9500';
      case 'pending': return '#8E8E93';
      default: return '#0066FF';
    }
  };

  const renderPetition = ({ item }) => (
    <TouchableOpacity style={styles.petitionCard}>
      <View style={styles.petitionHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.petitionDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.petitionTitle}>{item.title}</Text>
      <Text style={styles.petitionDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.petitionFooter}>
        <View style={styles.voteStats}>
          <Text style={styles.voteStat}>👍 {item.upvotes}</Text>
          <Text style={styles.voteStat}>👎 {item.downvotes}</Text>
        </View>
        <Text style={styles.viewDetails}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cases</Text>
        <TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0).toUpperCase() || 'M'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filterItem) => (
          <TouchableOpacity
            key={filterItem}
            style={[
              styles.filterChip,
              filter === filterItem && styles.filterChipActive
            ]}
            onPress={() => setFilter(filterItem)}
          >
            <Text style={[
              styles.filterText,
              filter === filterItem && styles.filterTextActive
            ]}>
              {filterItem === 'all' ? 'All' : filterItem.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Petitions List */}
      <FlatList
        data={petitions}
        renderItem={renderPetition}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPetitions} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyText}>No cases found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  petitionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  petitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  petitionDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  petitionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  petitionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  petitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  voteStats: {
    flexDirection: 'row',
    gap: 16,
  },
  voteStat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  viewDetails: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
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
});
