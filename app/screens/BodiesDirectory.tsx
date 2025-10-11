import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../supabase';

export default function BodiesDirectory({ user, onBack }) {
  const [bodies, setBodies] = useState([]);
  const [filteredBodies, setFilteredBodies] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [myMemberships, setMyMemberships] = useState([]);

  useEffect(() => {
    loadBodies();
    loadMyMemberships();
  }, []);

  const loadBodies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bodies')
      .select('*')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (data) {
      setBodies(data);
      setFilteredBodies(data);
    }
  };

  const loadMyMemberships = async () => {
    const { data } = await supabase
      .from('body_memberships')
      .select('body_id')
      .eq('member_id', user.id);

    if (data) {
      const membershipIds = data.map(m => m.body_id);
      setMyMemberships(membershipIds);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    
    if (!text.trim()) {
      setFilteredBodies(bodies);
      return;
    }

    const searchLower = text.toLowerCase();
    const filtered = bodies.filter(body => 
      body.name.toLowerCase().includes(searchLower) ||
      (body.description && body.description.toLowerCase().includes(searchLower)) ||
      (body.location && body.location.toLowerCase().includes(searchLower))
    );
    
    setFilteredBodies(filtered);
  };

  const handleJoinBody = async (bodyId, bodyName) => {
    // Check if already a member
    if (myMemberships.includes(bodyId)) {
      Alert.alert('Already a Member', 'You are already a member of this organization');
      return;
    }

    Alert.alert(
      'Join Organization',
      `Would you like to join ${bodyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            const { error } = await supabase
              .from('body_memberships')
              .insert([
                {
                  member_id: user.id,
                  body_id: bodyId,
                  status: 'active',
                },
              ]);

            if (error) {
              alert('Failed to join: ' + error.message);
            } else {
              // Update member count
              const { data: bodyData } = await supabase
                .from('bodies')
                .select('member_count')
                .eq('id', bodyId)
                .single();

              if (bodyData) {
                await supabase
                  .from('bodies')
                  .update({ member_count: bodyData.member_count + 1 })
                  .eq('id', bodyId);
              }

              alert('Successfully joined the organization!');
              loadMyMemberships();
              loadBodies();
            }
          },
        },
      ]
    );
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
            const { error } = await supabase
              .from('body_memberships')
              .delete()
              .eq('member_id', user.id)
              .eq('body_id', bodyId);

            if (error) {
              alert('Failed to leave: ' + error.message);
            } else {
              // Update member count
              const { data: bodyData } = await supabase
                .from('bodies')
                .select('member_count')
                .eq('id', bodyId)
                .single();

              if (bodyData && bodyData.member_count > 0) {
                await supabase
                  .from('bodies')
                  .update({ member_count: bodyData.member_count - 1 })
                  .eq('id', bodyId);
              }

              alert('You have left the organization');
              loadMyMemberships();
              loadBodies();
            }
          },
        },
      ]
    );
  };

  const renderBody = ({ item }) => {
    const isMember = myMemberships.includes(item.id);

    return (
      <View style={styles.bodyCard}>
        <View style={styles.bodyHeader}>
          <Text style={styles.bodyIcon}>🏢</Text>
          <View style={styles.bodyInfo}>
            <Text style={styles.bodyName}>{item.name}</Text>
            <Text style={styles.memberCount}>
              {item.member_count || 0} members
            </Text>
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
          <Text style={styles.bodyPoints}>⭐ {item.points || 0} points</Text>
          
          {isMember ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={() => handleLeaveBody(item.id, item.name)}
            >
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => handleJoinBody(item.id, item.name)}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organizations</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search organizations..."
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* Bodies List */}
      {filteredBodies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏢</Text>
          <Text style={styles.emptyText}>
            {searchText ? 'No organizations found' : 'No organizations yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchText ? 'Try a different search term' : 'Check back later for new organizations'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBodies}
          renderItem={renderBody}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadBodies} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#28a745',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  bodyCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bodyIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  bodyInfo: {
    flex: 1,
  },
  bodyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  bodyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  bodyLocation: {
    fontSize: 13,
    color: '#999',
    marginBottom: 10,
  },
  bodyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  bodyPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButton: {
    backgroundColor: '#28a745',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: '#f0f0f0',
  },
  leaveButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
