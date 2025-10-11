import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import IdeasScreen from './IdeasScreen';

export default function BodiesScreen({ user, profile }) {
  const [bodies, setBodies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBody, setSelectedBody] = useState(null);
  const [showIdeas, setShowIdeas] = useState(false);
  const [myBodies, setMyBodies] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'My Bodies'];

  useEffect(() => {
    loadBodies();
    loadMyBodies();
  }, []);

  const loadBodies = async () => {
    setLoading(true);
    
    let query = supabase
      .from('bodies')
      .select('*')
      .order('member_count', { ascending: false });

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data } = await query.limit(50);
    
    if (data) {
      setBodies(data);
    }

    setLoading(false);
  };

  const loadMyBodies = async () => {
    const { data } = await supabase
      .from('body_members')
      .select(`
        *,
        bodies:body_id (*)
      `)
      .eq('member_id', user.id);

    if (data) {
      setMyBodies(data.map(bm => bm.bodies));
    }
  };

  const handleJoinBody = async (bodyId) => {
    const { error } = await supabase
      .from('body_members')
      .insert([{
        body_id: bodyId,
        member_id: user.id,
      }]);

    if (!error) {
      alert('Successfully joined body!');
      loadMyBodies();
      
      // Update member count
      const { data: body } = await supabase
        .from('bodies')
        .select('member_count')
        .eq('user_id', bodyId)
        .single();

      await supabase
        .from('bodies')
        .update({ member_count: (body?.member_count || 0) + 1 })
        .eq('user_id', bodyId);

      loadBodies();
    }
  };

  const handleLeaveBody = async (bodyId) => {
    const { error } = await supabase
      .from('body_members')
      .delete()
      .eq('body_id', bodyId)
      .eq('member_id', user.id);

    if (!error) {
      alert('Left body successfully');
      loadMyBodies();

      // Update member count
      const { data: body } = await supabase
        .from('bodies')
        .select('member_count')
        .eq('user_id', bodyId)
        .single();

      await supabase
        .from('bodies')
        .update({ member_count: Math.max(0, (body?.member_count || 1) - 1) })
        .eq('user_id', bodyId);

      loadBodies();
    }
  };

  const isMemberOfBody = (bodyId) => {
    return myBodies.some(b => b.user_id === bodyId);
  };

  // Show Ideas Screen if selected
  if (showIdeas && selectedBody) {
    return (
      <IdeasScreen 
        user={user} 
        bodyId={selectedBody.user_id}
        onBack={() => {
          setShowIdeas(false);
          setSelectedBody(null);
        }}
      />
    );
  }

  const renderBody = ({ item }) => {
    const isMember = isMemberOfBody(item.user_id);

    return (
      <View style={styles.bodyCard}>
        <View style={styles.bodyHeader}>
          <View style={styles.bodyAvatar}>
            <Text style={styles.bodyAvatarText}>
              {item.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.bodyInfo}>
            <Text style={styles.bodyName}>{item.name}</Text>
            <Text style={styles.bodyStats}>
              👥 {item.member_count || 0} members • 📊 {item.points || 0} points
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.bodyDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.bodyActions}>
          {isMember ? (
            <>
              <TouchableOpacity 
                style={styles.ideasButton}
                onPress={() => {
                  setSelectedBody(item);
                  setShowIdeas(true);
                }}
              >
                <Text style={styles.ideasButtonText}>💡 Ideas Box</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => alert('View body details coming soon')}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.leaveButton}
                onPress={() => handleLeaveBody(item.user_id)}
              >
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => handleJoinBody(item.user_id)}
            >
              <Text style={styles.joinButtonText}>Join Body</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const displayedBodies = activeTab === 'All' ? bodies : myBodies;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bodies</Text>
        <TouchableOpacity>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bodies..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            loadBodies();
          }}
          placeholderTextColor="#8E8E93"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bodies List */}
      <FlatList
        data={displayedBodies}
        renderItem={renderBody}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {
            loadBodies();
            loadMyBodies();
          }} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'All' ? 'No bodies found' : 'You haven\'t joined any bodies yet'}
            </Text>
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterIcon: {
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#3C3C43',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    gap: 10,
    marginTop: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 15,
  },
  bodyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bodyHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bodyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bodyAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  bodyInfo: {
    flex: 1,
  },
  bodyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bodyStats: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bodyDescription: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 12,
  },
  bodyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ideasButton: {
    flex: 1,
    backgroundColor: '#FFF9E6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  ideasButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  leaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#0066FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
