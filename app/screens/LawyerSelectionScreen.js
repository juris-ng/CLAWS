import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../supabase';

export default function LawyerSelectionScreen({ petition, user, onBack, onSuccess }) {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadLawyers();
  }, [searchText]);

  const loadLawyers = async () => {
    setLoading(true);
    
    let query = supabase
      .from('lawyers')
      .select('*')
      .order('points', { ascending: false });

    if (searchText) {
      query = query.ilike('full_name', `%${searchText}%`);
    }

    const { data } = await query.limit(20);
    
    if (data) {
      setLawyers(data);
    }

    setLoading(false);
  };

  const handleInvite = async () => {
    if (!selectedLawyer) {
      alert('Please select a lawyer');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('lawyer_invitations')
      .insert([
        {
          petition_id: petition.id,
          lawyer_id: selectedLawyer.user_id,
          invited_by: user.id,
          message: message || 'We need your legal expertise on this petition.',
          status: 'pending',
        },
      ]);

    setLoading(false);

    if (error) {
      alert('Failed to send invitation: ' + error.message);
    } else {
      alert('Lawyer invitation sent successfully!');
      if (onSuccess) onSuccess();
      onBack();
    }
  };

  const renderLawyer = ({ item }) => {
    const isSelected = selectedLawyer?.user_id === item.user_id;

    return (
      <TouchableOpacity
        style={[styles.lawyerCard, isSelected && styles.lawyerCardSelected]}
        onPress={() => setSelectedLawyer(item)}
      >
        <View style={styles.lawyerAvatar}>
          <Text style={styles.lawyerAvatarText}>
            {item.full_name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.lawyerContent}>
          <Text style={styles.lawyerName}>{item.full_name}</Text>
          <Text style={styles.lawyerPractice}>{item.practice_areas}</Text>
          <View style={styles.lawyerStats}>
            <Text style={styles.lawyerStat}>⚖️ {item.points} Points</Text>
            {item.license_number && (
              <Text style={styles.lawyerStat}>• License: {item.license_number}</Text>
            )}
          </View>
        </View>

        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Lawyer</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#8E8E93"
        />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerIcon}>💡</Text>
        <Text style={styles.infoBannerText}>
          Invite a lawyer to provide legal expertise and credibility to your petition
        </Text>
      </View>

      {/* Lawyers List */}
      <FlatList
        data={lawyers}
        renderItem={renderLawyer}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" color="#0066FF" />
            ) : (
              <>
                <Text style={styles.emptyIcon}>⚖️</Text>
                <Text style={styles.emptyText}>No lawyers found</Text>
              </>
            )}
          </View>
        )}
      />

      {/* Message Input */}
      {selectedLawyer && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Add a message (optional)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Explain why you need legal support..."
            value={message}
            onChangeText={setMessage}
            multiline
            placeholderTextColor="#8E8E93"
          />
        </View>
      )}

      {/* Invite Button */}
      {selectedLawyer && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={handleInvite}
          disabled={loading}
        >
          <Text style={styles.inviteButtonText}>
            {loading ? 'Sending...' : `Invite ${selectedLawyer.full_name}`}
          </Text>
        </TouchableOpacity>
      )}
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoBannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#0066FF',
    lineHeight: 18,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 200,
  },
  lawyerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  lawyerCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  lawyerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#AF52DE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lawyerAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  lawyerContent: {
    flex: 1,
  },
  lawyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lawyerPractice: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
  lawyerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawyerStat: {
    fontSize: 12,
    color: '#3C3C43',
    marginRight: 8,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  messageInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inviteButton: {
    backgroundColor: '#0066FF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
