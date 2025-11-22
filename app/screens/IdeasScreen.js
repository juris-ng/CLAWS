import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import IdeasComposerScreen from './IdeasComposerScreen';


export default function IdeasScreen({ user, bodyId, onBack }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'submitted', 'under_review', 'accepted'


  const filters = [
    { value: 'all', label: 'All Ideas' },
    { value: 'submitted', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'implemented', label: 'Implemented' },
  ];


  useEffect(() => {
    loadIdeas();
  }, [filter]);


  const loadIdeas = async () => {
    setLoading(true);


    let query = supabase
      .from('ideas')
      .select(`
        *,
        members:member_id (full_name)
      `)
      .eq('body_id', bodyId)
      .order('created_at', { ascending: false });


    if (filter !== 'all') {
      query = query.eq('status', filter);
    }


    const { data } = await query;


    if (data) {
      setIdeas(data);
    }


    setLoading(false);
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#FF9500';
      case 'under_review': return '#0066FF';
      case 'accepted': return '#34C759';
      case 'implemented': return '#AF52DE';
      case 'rejected': return '#FF3B30';
      default: return '#8E8E93';
    }
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted': return '📬';
      case 'under_review': return '🔍';
      case 'accepted': return '✅';
      case 'implemented': return '🎉';
      case 'rejected': return '❌';
      default: return '💡';
    }
  };


  if (showComposer) {
    return (
      <IdeasComposerScreen
        user={user}
        bodyId={bodyId}
        onBack={() => setShowComposer(false)}
        onSuccess={() => loadIdeas()}
      />
    );
  }


  const renderIdea = ({ item }) => (
    <TouchableOpacity style={styles.ideaCard}>
      <View style={styles.ideaHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
        <Text style={styles.ideaDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>


      <Text style={styles.ideaTitle}>{item.title}</Text>
      <Text style={styles.ideaDescription} numberOfLines={3}>
        {item.description}
      </Text>


      <View style={styles.ideaFooter}>
        <View style={styles.ideaAuthor}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>
              {item.members?.full_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName}>{item.members?.full_name}</Text>
        </View>


        <View style={styles.ideaVotes}>
          <TouchableOpacity style={styles.voteButton}>
            <Text style={styles.voteIcon}>👍</Text>
            <Text style={styles.voteCount}>{item.upvotes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.voteButton}>
            <Text style={styles.voteIcon}>👎</Text>
            <Text style={styles.voteCount}>{item.downvotes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ideas Box</Text>
          <TouchableOpacity onPress={() => setShowComposer(true)}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>


        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          style={styles.filterContainer}
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterButton,
                filter === f.value && styles.filterButtonActive
              ]}
              onPress={() => setFilter(f.value)}
            >
              <Text style={[
                styles.filterText,
                filter === f.value && styles.filterTextActive
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


        {/* Ideas List */}
        <FlatList
          data={ideas}
          renderItem={renderIdea}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadIdeas} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💡</Text>
              <Text style={styles.emptyTitle}>No Ideas Yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share a suggestion with this body!
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowComposer(true)}
              >
                <Text style={styles.emptyButtonText}>Submit an Idea</Text>
              </TouchableOpacity>
            </View>
          )}
        />


        {/* FAB */}
        {ideas.length > 0 && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => setShowComposer(true)}
          >
            <Text style={styles.fabIcon}>💡</Text>
          </TouchableOpacity>
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 60,
  },
  backIcon: {
    fontSize: 24,
    color: '#0066FF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addIcon: {
    fontSize: 36,
    color: '#0066FF',
    lineHeight: 36,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 10,
  },
  filterButtonActive: {
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
  listContainer: {
    padding: 15,
  },
  ideaCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  ideaDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  ideaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ideaDescription: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 12,
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  ideaAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  ideaVotes: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteIcon: {
    fontSize: 16,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
});
