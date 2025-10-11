import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { PETITION_CATEGORIES, getCategoryIcon } from '../constants/Categories';
import BodiesDirectory from './BodiesDirectory';
import EditProfile from './EditProfile';
import PetitionDetail from './PetitionDetail';
import PointsHistory from './PointsHistory';

const SORT_OPTIONS = [
  { value: 'newest', label: '🕐 Newest First' },
  { value: 'oldest', label: '📅 Oldest First' },
  { value: 'most_voted', label: '🔥 Most Voted' },
  { value: 'most_discussed', label: '💬 Most Discussed' },
];

export default function Dashboard({ user }) {
  const [petitions, setPetitions] = useState([]);
  const [filteredPetitions, setFilteredPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [commentsCount, setCommentsCount] = useState({});
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Create petition modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [petitionTitle, setPetitionTitle] = useState('');
  const [petitionDescription, setPetitionDescription] = useState('');
  const [petitionCategory, setPetitionCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  
  // Navigation states
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [showBodiesDirectory, setShowBodiesDirectory] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);

  useEffect(() => {
    loadMemberData();
    loadPetitions();
    loadUserVotes();
    loadCommentsCount();
  }, []);

  useEffect(() => {
    filterAndSortPetitions();
  }, [petitions, selectedCategory, searchText, sortBy, commentsCount]);

  const loadMemberData = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setMemberData(data);
    }
  };

  const loadPetitions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('petitions')
      .select('*')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (data) {
      setPetitions(data);
    }
  };

  const loadCommentsCount = async () => {
    const { data } = await supabase
      .from('comments')
      .select('petition_id');

    if (data) {
      const counts = {};
      data.forEach(comment => {
        counts[comment.petition_id] = (counts[comment.petition_id] || 0) + 1;
      });
      setCommentsCount(counts);
    }
  };

  const filterAndSortPetitions = () => {
    let filtered = petitions;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'most_voted':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'most_discussed':
          return (commentsCount[b.id] || 0) - (commentsCount[a.id] || 0);
        default:
          return 0;
      }
    });

    setFilteredPetitions(filtered);
  };

  const loadUserVotes = async () => {
    const { data, error } = await supabase
      .from('votes')
      .select('petition_id, vote_type')
      .eq('member_id', user.id);

    if (data) {
      const votesMap = {};
      data.forEach(vote => {
        votesMap[vote.petition_id] = vote.vote_type;
      });
      setUserVotes(votesMap);
    }
  };

  const handleVote = async (petitionId, voteType) => {
    const currentVote = userVotes[petitionId];

    if (currentVote === voteType) {
      await removeVote(petitionId, voteType);
      return;
    }

    if (currentVote) {
      await updateVote(petitionId, currentVote, voteType);
      return;
    }

    await addVote(petitionId, voteType);
  };

  const addVote = async (petitionId, voteType) => {
    const { error: voteError } = await supabase
      .from('votes')
      .insert([
        {
          member_id: user.id,
          petition_id: petitionId,
          vote_type: voteType,
        },
      ]);

    if (voteError) {
      alert('Failed to vote: ' + voteError.message);
      return;
    }

    const functionName = voteType === 'upvote' ? 'increment_upvotes' : 'increment_downvotes';
    await supabase.rpc(functionName, { petition_id: petitionId });

    setUserVotes({ ...userVotes, [petitionId]: voteType });
    loadPetitions();
    loadMemberData();
  };

  const removeVote = async (petitionId, voteType) => {
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('member_id', user.id)
      .eq('petition_id', petitionId);

    if (deleteError) {
      alert('Failed to remove vote: ' + deleteError.message);
      return;
    }

    const functionName = voteType === 'upvote' ? 'decrement_upvotes' : 'decrement_downvotes';
    await supabase.rpc(functionName, { petition_id: petitionId });

    const newVotes = { ...userVotes };
    delete newVotes[petitionId];
    setUserVotes(newVotes);
    loadPetitions();
  };

  const updateVote = async (petitionId, oldVote, newVote) => {
    const { error: updateError } = await supabase
      .from('votes')
      .update({ vote_type: newVote })
      .eq('member_id', user.id)
      .eq('petition_id', petitionId);

    if (updateError) {
      alert('Failed to update vote: ' + updateError.message);
      return;
    }

    const decrementFn = oldVote === 'upvote' ? 'decrement_upvotes' : 'decrement_downvotes';
    const incrementFn = newVote === 'upvote' ? 'increment_upvotes' : 'increment_downvotes';
    
    await supabase.rpc(decrementFn, { petition_id: petitionId });
    await supabase.rpc(incrementFn, { petition_id: petitionId });

    setUserVotes({ ...userVotes, [petitionId]: newVote });
    loadPetitions();
  };

  const handleCreatePetition = async () => {
    if (!petitionTitle.trim() || !petitionDescription.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('petitions')
      .insert([
        {
          member_id: user.id,
          title: petitionTitle,
          description: petitionDescription,
          category: petitionCategory,
          upvotes: 0,
          downvotes: 0,
          status: 'pending',
        },
      ])
      .select();

    setSubmitting(false);

    if (error) {
      alert('Failed to create petition: ' + error.message);
    } else {
      alert('Petition created successfully! You earned 10 points!');
      setPetitionTitle('');
      setPetitionDescription('');
      setPetitionCategory('general');
      setModalVisible(false);
      loadPetitions();
      loadMemberData();
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const renderPetition = ({ item }) => {
    const userVote = userVotes[item.id];
    const commentCount = commentsCount[item.id] || 0;
    
    return (
      <TouchableOpacity 
        style={styles.petitionCard}
        onPress={() => setSelectedPetition(item)}
      >
        <View style={styles.petitionHeader}>
          <Text style={styles.categoryBadge}>
            {getCategoryIcon(item.category)} {item.category}
          </Text>
          {commentCount > 0 && (
            <Text style={styles.commentBadge}>💬 {commentCount}</Text>
          )}
        </View>
        
        <Text style={styles.petitionTitle}>{item.title}</Text>
        <Text style={styles.petitionDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.voteContainer}>
          <View style={styles.voteButtons}>
            <TouchableOpacity 
              style={[
                styles.voteButton,
                userVote === 'upvote' && styles.voteButtonActive
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleVote(item.id, 'upvote');
              }}
            >
              <Text style={[
                styles.voteButtonText,
                userVote === 'upvote' && styles.voteButtonTextActive
              ]}>
                👍 {item.upvotes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.voteButton,
                userVote === 'downvote' && styles.voteButtonActive
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleVote(item.id, 'downvote');
              }}
            >
              <Text style={[
                styles.voteButtonText,
                userVote === 'downvote' && styles.voteButtonTextActive
              ]}>
                👎 {item.downvotes}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tapToView}>Tap to view details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Show edit profile if state is true
  if (showEditProfile) {
    return <EditProfile user={user} onBack={() => {
      setShowEditProfile(false);
      loadMemberData(); // Refresh member data after editing
    }} />;
  }

  if (showBodiesDirectory) {
    return <BodiesDirectory user={user} onBack={() => setShowBodiesDirectory(false)} />;
  }

  if (selectedPetition) {
    return (
      <PetitionDetail 
        petition={selectedPetition} 
        user={user}
        onBack={() => {
          setSelectedPetition(null);
          loadPetitions();
          loadMemberData();
          loadCommentsCount();
        }}
      />
    );
  }

  if (showPointsHistory) {
    return <PointsHistory user={user} onBack={() => setShowPointsHistory(false)} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.nameText}>{memberData?.full_name}</Text>
          <TouchableOpacity onPress={() => setShowPointsHistory(true)}>
            <Text style={styles.pointsText}>
              Points: {memberData?.points || 0} 👉
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditProfile(true)}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search petitions..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Sort Options */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.sortScroll}
        contentContainerStyle={styles.sortContainer}
      >
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortChip,
              sortBy === option.value && styles.sortChipActive
            ]}
            onPress={() => setSortBy(option.value)}
          >
            <Text style={[
              styles.sortChipText,
              sortBy === option.value && styles.sortChipTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.categoryChipTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {PETITION_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.value && styles.categoryChipTextActive
            ]}>
              {cat.icon} {cat.value}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section Header with Organizations Button */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Petitions ({filteredPetitions.length})
        </Text>
        <TouchableOpacity 
          style={styles.bodiesButton}
          onPress={() => setShowBodiesDirectory(true)}
        >
          <Text style={styles.bodiesButtonText}>🏢 Organizations</Text>
        </TouchableOpacity>
      </View>
      
      {filteredPetitions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchText || selectedCategory !== 'all' 
              ? 'No petitions match your search' 
              : 'No petitions yet'}
          </Text>
          <Text style={styles.emptySubText}>
            {searchText || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Be the first to create one!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPetitions}
          renderItem={renderPetition}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadPetitions} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Petition Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create New Petition</Text>
              
              <Text style={styles.label}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.modalCategoryScroll}
              >
                {PETITION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.modalCategoryChip,
                      petitionCategory === cat.value && styles.modalCategoryChipActive
                    ]}
                    onPress={() => setPetitionCategory(cat.value)}
                  >
                    <Text style={[
                      styles.modalCategoryChipText,
                      petitionCategory === cat.value && styles.modalCategoryChipTextActive
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter petition title"
                value={petitionTitle}
                onChangeText={setPetitionTitle}
                maxLength={100}
              />
              
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your petition in detail..."
                value={petitionDescription}
                onChangeText={setPetitionDescription}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setPetitionTitle('');
                    setPetitionDescription('');
                    setPetitionCategory('general');
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreatePetition}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Creating...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 14,
  },
  nameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: '#007bff',
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
  sortScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sortContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  sortChipActive: {
    backgroundColor: '#6610f2',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  categoryScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  categoryContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#007bff',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bodiesButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bodiesButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  petitionCard: {
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
  petitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  commentBadge: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  petitionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  petitionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  voteButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  voteButtonActive: {
    backgroundColor: '#007bff',
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  voteButtonTextActive: {
    color: '#fff',
  },
  tapToView: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#333',
  },
  modalCategoryScroll: {
    marginBottom: 15,
  },
  modalCategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  modalCategoryChipActive: {
    backgroundColor: '#007bff',
  },
  modalCategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modalCategoryChipTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
