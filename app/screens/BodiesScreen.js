import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
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
import IdeasScreen from './IdeasScreen';

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

export default function BodiesScreen({ user, profile }) {
  const [myBodies, setMyBodies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBody, setSelectedBody] = useState(null);
  const [showIdeas, setShowIdeas] = useState(false);

  useEffect(() => {
    loadMyBodies();
  }, []);

  const loadMyBodies = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('body_members')
      .select(`
        *,
        bodies:body_id (*)
      `)
      .eq('member_id', user.id);

    if (data) {
      setMyBodies(data.map((bm) => bm.bodies).filter(b => b !== null));
    }
    setLoading(false);
  };

  const handleLeaveBody = async (bodyId) => {
    Alert.alert('Leave Organization', 'Are you sure you want to leave this organization?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('body_members')
            .delete()
            .eq('body_id', bodyId)
            .eq('member_id', user.id);

          if (!error) {
            Alert.alert('Success', 'Left organization successfully');
            loadMyBodies();

            const { data: body } = await supabase
              .from('bodies')
              .select('member_count')
              .eq('id', bodyId)
              .single();

            await supabase
              .from('bodies')
              .update({ member_count: Math.max(0, (body?.member_count || 1) - 1) })
              .eq('id', bodyId);
          } else {
            Alert.alert('Error', 'Failed to leave organization');
          }
        },
      },
    ]);
  };

  if (showIdeas && selectedBody) {
    return (
      <IdeasScreen
        user={user}
        bodyId={selectedBody.id}
        onBack={() => {
          setShowIdeas(false);
          setSelectedBody(null);
        }}
      />
    );
  }

  const filteredBodies = myBodies.filter(body => 
    body.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBody = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.bodyCard}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedBody(item);
          setShowIdeas(true);
        }}
      >
        <View style={styles.bodyContent}>
          <View style={styles.bodyAvatar}>
            <Text style={styles.bodyAvatarText}>
              {item.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.bodyInfo}>
            <Text style={styles.bodyName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.bodyStats}>
              <Ionicons name="people-outline" size={12} color={COLORS.mediumGray} />
              <Text style={styles.bodyStatsText}>{item.member_count || 0} members</Text>
              <View style={styles.statDivider} />
              <Ionicons name="star-outline" size={12} color={COLORS.mediumGray} />
              <Text style={styles.bodyStatsText}>{item.points || 0} pts</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert(
                item.name,
                'Choose an action',
                [
                  {
                    text: 'Ideas Box',
                    onPress: () => {
                      setSelectedBody(item);
                      setShowIdeas(true);
                    },
                  },
                  {
                    text: 'Leave Organization',
                    style: 'destructive',
                    onPress: () => handleLeaveBody(item.id),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Organizations</Text>
            <Text style={styles.headerSubtitle}>{myBodies.length} organizations joined</Text>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={COLORS.mediumGray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search organizations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.mediumGray}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            )}
          </View>

          {/* Bodies List */}
          <FlatList
            data={filteredBodies}
            renderItem={renderBody}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadMyBodies}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={64} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No organizations found' : "You haven't joined any organizations yet"}
                </Text>
                <Text style={styles.emptySubtext}>
                  Join organizations to stay connected with public bodies
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
    padding: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bodyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bodyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  bodyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bodyAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
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
  bodyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bodyStatsText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  statDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 4,
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});
