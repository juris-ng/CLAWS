import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { ConsultationService } from '../../utils/consultationService';

const MyConsultationsScreen = ({ navigation }) => {
  const [consultations, setConsultations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const filters = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'completed', label: 'Completed', icon: '🎯' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      loadConsultations();
    }
  }, [filter, userId]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Check if user is lawyer
        const { data: lawyerData } = await supabase
          .from('lawyers')
          .select('id')
          .eq('id', user.id)
          .single();

        setUserRole(lawyerData ? 'lawyer' : 'client');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadConsultations = async () => {
    try {
      const status = filter === 'all' ? null : filter;
      const result = await ConsultationService.getMyConsultations(status);
      if (result.success) {
        setConsultations(result.consultations || []);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
      Alert.alert('Error', 'Failed to load consultations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConsultations();
  };

  const handleCancel = (consultation) => {
    Alert.alert(
      'Cancel Consultation',
      'Are you sure you want to cancel this consultation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await ConsultationService.cancelConsultation(
                consultation.id,
                `Cancelled by ${userRole}`
              );
              if (result.success) {
                Alert.alert('Success', 'Consultation cancelled');
                loadConsultations();
              } else {
                Alert.alert('Error', result.error || 'Failed to cancel');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel consultation');
            }
          },
        },
      ]
    );
  };

  const handleConfirm = async (consultation) => {
    if (userRole !== 'lawyer') return;

    try {
      const result = await ConsultationService.updateConsultationStatus(
        consultation.id,
        'confirmed'
      );
      if (result.success) {
        Alert.alert('Success', 'Consultation confirmed');
        loadConsultations();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm consultation');
    }
  };

  const handleComplete = async (consultation) => {
    if (userRole !== 'lawyer') return;

    try {
      const result = await ConsultationService.updateConsultationStatus(
        consultation.id,
        'completed'
      );
      if (result.success) {
        Alert.alert('Success', 'Consultation marked as completed');
        loadConsultations();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete consultation');
    }
  };

  const handleJoinMeeting = (consultation) => {
    if (consultation.meeting_link) {
      Linking.openURL(consultation.meeting_link);
    } else {
      Alert.alert('Info', 'Meeting link not available yet');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
      onPress={() => setFilter(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderConsultation = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const consultationDate = new Date(item.consultation_date);
    const isPast = consultationDate < new Date();
    const isUpcoming = consultationDate > new Date() && item.status === 'confirmed';
    const canCancel =
      (item.status === 'pending' || item.status === 'confirmed') && !isPast;
    const canConfirm = userRole === 'lawyer' && item.status === 'pending';
    const canComplete =
      userRole === 'lawyer' && item.status === 'confirmed' && isPast;

    // Get the other party's info
    const otherParty =
      userRole === 'lawyer' ? item.client : item.lawyer;

    return (
      <View style={styles.consultationCard}>
        <View style={styles.consultationHeader}>
          <View style={styles.consultationInfo}>
            <Text style={styles.partyLabel}>
              {userRole === 'lawyer' ? 'Client' : 'Lawyer'}:
            </Text>
            <Text style={styles.partyName}>{otherParty?.full_name || 'Unknown'}</Text>
            {userRole === 'client' && item.lawyer?.law_firm && (
              <Text style={styles.lawFirm}>{item.lawyer.law_firm}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        {isUpcoming && (
          <View style={styles.upcomingBanner}>
            <Text style={styles.upcomingText}>⏰ Upcoming Soon!</Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              {consultationDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <Text style={styles.detailText}>
              {consultationDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏱️</Text>
            <Text style={styles.detailText}>{item.duration_minutes || 60} minutes</Text>
          </View>

          {item.consultation_type && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📋</Text>
              <Text style={styles.detailText}>
                {item.consultation_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          )}

          {item.meeting_mode && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>
                {item.meeting_mode === 'video'
                  ? '📹'
                  : item.meeting_mode === 'phone'
                  ? '📞'
                  : '🏢'}
              </Text>
              <Text style={styles.detailText}>
                {item.meeting_mode.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {item.client_notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.client_notes}</Text>
          </View>
        )}

        {item.fee_amount && (
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Fee:</Text>
            <Text style={styles.feeAmount}>
              KES {parseFloat(item.fee_amount).toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {canConfirm && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleConfirm(item)}
            >
              <Text style={styles.confirmButtonText}>✓ Confirm</Text>
            </TouchableOpacity>
          )}

          {canComplete && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleComplete(item)}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {item.meeting_link && item.status === 'confirmed' && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinMeeting(item)}
            >
              <Text style={styles.joinButtonText}>Join Meeting</Text>
            </TouchableOpacity>
          )}

          {userRole === 'client' && (
            <TouchableOpacity
              style={styles.viewLawyerButton}
              onPress={() =>
                navigation.navigate('LawyerProfile', { lawyerId: item.lawyer_id })
              }
            >
              <Text style={styles.viewLawyerButtonText}>View Lawyer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading consultations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Consultations</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>{consultations.length} total</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={filters}
            renderItem={renderFilter}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        {/* Consultations List */}
        <FlatList
          data={consultations}
          renderItem={renderConsultation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No consultations found</Text>
              <Text style={styles.emptySubtext}>
                {filter !== 'all'
                  ? 'Try changing your filter'
                  : userRole === 'client'
                  ? 'Book a consultation with a lawyer'
                  : 'No consultation requests yet'}
              </Text>
              {userRole === 'client' && (
                <TouchableOpacity
                  style={styles.findLawyersButton}
                  onPress={() => navigation.navigate('LawyersList')}
                >
                  <Text style={styles.findLawyersText}>Find Lawyers</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  consultationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  consultationInfo: {
    flex: 1,
    marginRight: 12,
  },
  partyLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  partyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  lawFirm: {
    fontSize: 14,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  upcomingBanner: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  upcomingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  notesContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
    minWidth: '45%',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewLawyerButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
  },
  viewLawyerButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  findLawyersButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  findLawyersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyConsultationsScreen;
