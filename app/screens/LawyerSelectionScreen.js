import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { LawyerService } from '../../utils/lawyerService';

export default function LawyerSelectionScreen({ 
  petition, 
  user, 
  caseId = null,
  onBack, 
  onSuccess,
  navigation 
}) {
  const [lawyers, setLawyers] = useState([]);
  const [practiceAreas, setPracticeAreas] = useState([]);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [invitedLawyers, setInvitedLawyers] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadLawyers();
  }, [searchText, selectedPracticeArea]);

  const loadInitialData = async () => {
    try {
      // Load practice areas
      const areasResult = await LawyerService.getPracticeAreas();
      if (areasResult.success) {
        setPracticeAreas(areasResult.practiceAreas || []);
      }

      // Load already invited lawyers
      if (petition?.id) {
        const { data } = await supabase
          .from('lawyer_invitations')
          .select('lawyer_id')
          .eq('petition_id', petition.id);
        
        setInvitedLawyers(data?.map(inv => inv.lawyer_id) || []);
      }

      loadLawyers();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadLawyers = async () => {
    setLoading(true);

    try {
      const filters = {};
      
      if (selectedPracticeArea) {
        filters.practiceAreaId = selectedPracticeArea;
      }

      const result = await LawyerService.searchLawyers(filters);

      if (result.success) {
        let lawyersList = result.lawyers || [];

        // Filter by search text
        if (searchText) {
          const query = searchText.toLowerCase();
          lawyersList = lawyersList.filter(lawyer =>
            lawyer.full_name?.toLowerCase().includes(query) ||
            lawyer.law_firm?.toLowerCase().includes(query)
          );
        }

        // Sort by rating
        lawyersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setLawyers(lawyersList);
      }
    } catch (error) {
      console.error('Error loading lawyers:', error);
      Alert.alert('Error', 'Failed to load lawyers');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedLawyer) {
      Alert.alert('Error', 'Please select a lawyer');
      return;
    }

    // Check if already invited
    if (invitedLawyers.includes(selectedLawyer.id)) {
      Alert.alert('Already Invited', 'You have already invited this lawyer.');
      return;
    }

    setLoading(true);

    try {
      const invitationData = {
        lawyer_id: selectedLawyer.id,
        invited_by: user.id,
        message: message || 'We need your legal expertise on this petition.',
        status: 'pending',
      };

      if (petition?.id) {
        invitationData.petition_id = petition.id;
      }

      if (caseId) {
        invitationData.case_id = caseId;
      }

      const { error } = await supabase
        .from('lawyer_invitations')
        .insert([invitationData]);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Invitation sent to ${selectedLawyer.full_name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
              if (onBack) onBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', 'Failed to send invitation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (lawyer) => {
    if (navigation) {
      navigation.navigate('LawyerProfile', { lawyerId: lawyer.id });
    }
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= roundedRating ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  const renderLawyer = ({ item }) => {
    const isSelected = selectedLawyer?.id === item.id;
    const isInvited = invitedLawyers.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.lawyerCard,
          isSelected && styles.lawyerCardSelected,
          isInvited && styles.lawyerCardInvited,
        ]}
        onPress={() => !isInvited && setSelectedLawyer(item)}
        disabled={isInvited}
      >
        <View style={styles.lawyerHeader}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.lawyerAvatar} />
          ) : (
            <View style={styles.lawyerAvatar}>
              <Text style={styles.lawyerAvatarText}>
                {item.full_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          <View style={styles.lawyerContent}>
            <View style={styles.nameRow}>
              <Text style={styles.lawyerName} numberOfLines={1}>
                {item.full_name}
              </Text>
              {item.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>

            {item.law_firm && (
              <Text style={styles.lawyerFirm} numberOfLines={1}>
                {item.law_firm}
              </Text>
            )}

            <View style={styles.ratingRow}>{renderRatingStars(item.rating)}</View>

            <View style={styles.lawyerStats}>
              <Text style={styles.lawyerStat}>
                💼 {item.years_of_experience || 0} years
              </Text>
              {item.consultation_fee && (
                <Text style={styles.lawyerStat}>
                  • 💰 {item.consultation_fee.toLocaleString()} KES
                </Text>
              )}
            </View>

            {item.bar_number && (
              <Text style={styles.barNumber}>Bar: {item.bar_number}</Text>
            )}
          </View>

          {isInvited && (
            <View style={styles.invitedBadge}>
              <Text style={styles.invitedText}>Invited</Text>
            </View>
          )}

          {isSelected && !isInvited && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>

        {/* View Profile Button */}
        {navigation && !isInvited && (
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => handleViewProfile(item)}
          >
            <Text style={styles.viewProfileText}>View Profile →</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Lawyer</Text>
          <View style={styles.backButton} />
        </View>

        {/* Search & Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or firm..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Practice Area:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedPracticeArea}
                onValueChange={setSelectedPracticeArea}
                style={styles.picker}
              >
                <Picker.Item label="All Areas" value="" />
                {practiceAreas.map((area) => (
                  <Picker.Item
                    key={area.id}
                    label={`${area.icon || ''} ${area.name}`}
                    value={area.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>💡</Text>
          <Text style={styles.infoBannerText}>
            Select a lawyer to provide legal expertise and credibility to your{' '}
            {petition ? 'petition' : 'case'}
          </Text>
        </View>

        {/* Lawyers List */}
        <FlatList
          data={lawyers}
          renderItem={renderLawyer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadLawyers}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              {loading ? (
                <>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingText}>Loading lawyers...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyIcon}>⚖️</Text>
                  <Text style={styles.emptyText}>No lawyers found</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search filters
                  </Text>
                </>
              )}
            </View>
          )}
        />

        {/* Message Input */}
        {selectedLawyer && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>
              Add a message to {selectedLawyer.full_name} (optional)
            </Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Explain why you need legal support..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              placeholderTextColor="#8E8E93"
            />
          </View>
        )}

        {/* Invite Button */}
        {selectedLawyer && (
          <TouchableOpacity
            style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
            onPress={handleInvite}
            disabled={loading}
          >
            <Text style={styles.inviteButtonText}>
              {loading ? 'Sending Invitation...' : `Invite ${selectedLawyer.full_name}`}
            </Text>
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
    color: '#4CAF50',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
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
  filterRow: {
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  pickerContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  picker: {
    height: 50,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
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
    color: '#2E7D32',
    lineHeight: 18,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 200,
  },
  lawyerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  lawyerCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  lawyerCardInvited: {
    opacity: 0.6,
    borderColor: '#999',
  },
  lawyerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lawyerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lawyerAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  lawyerContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lawyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lawyerFirm: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  star: {
    fontSize: 14,
  },
  lawyerStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  lawyerStat: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  barNumber: {
    fontSize: 11,
    color: '#999',
  },
  invitedBadge: {
    backgroundColor: '#999',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  invitedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewProfileButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewProfileText: {
    color: '#2196F3',
    fontSize: 13,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
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
    color: '#333',
    marginBottom: 10,
  },
  messageInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inviteButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
