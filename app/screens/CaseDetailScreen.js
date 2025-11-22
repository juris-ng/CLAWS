import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { MemberCaseService } from '../../utils/MemberCaseService';

export default function CaseDetailScreen({ route, navigation }) {
  const { caseId } = route.params;
  const { user } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateDescription, setUpdateDescription] = useState('');

  const statusSteps = ['filed', 'hearing', 'verdict', 'resolved'];
  const statusColors = {
    filed: '#FF9800',
    hearing: '#2196F3',
    verdict: '#9C27B0',
    resolved: '#4CAF50',
    dismissed: '#F44336',
  };

  const statusEmojis = {
    filed: '📋',
    hearing: '⚖️',
    verdict: '📜',
    resolved: '✅',
    dismissed: '❌',
  };

  useEffect(() => {
    loadCaseDetails();
  }, [caseId]);

  const loadCaseDetails = async () => {
    try {
      setLoading(true);

      // Get case details
      const { data: caseInfo, error: caseError } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caseInfo);

      // Get timeline
      const timelineResult = await MemberCaseService.getCaseTimeline(caseId);
      if (timelineResult.success) {
        setTimeline(timelineResult.timeline);
      }

      // Get participants
      const participantsResult = await MemberCaseService.getCaseParticipants(caseId);
      if (participantsResult.success) {
        setParticipants(participantsResult.participants);
      }
    } catch (error) {
      console.error('Error loading case details:', error);
      Alert.alert('Error', 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!caseData) return 0;
    const currentIndex = statusSteps.indexOf(caseData.status);
    return ((currentIndex + 1) / statusSteps.length) * 100;
  };

  const handleAddUpdate = async () => {
    if (!updateDescription.trim()) {
      Alert.alert('Empty Update', 'Please enter an update description');
      return;
    }

    try {
      setUpdating(true);
      const result = await MemberCaseService.addTimelineEvent(
        caseId,
        user.id,
        'update',
        updateDescription
      );

      if (result.success) {
        setUpdateDescription('');
        loadCaseDetails();
        Alert.alert('Success', 'Update added to case timeline');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error adding update:', error);
      Alert.alert('Error', 'Failed to add update');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const result = await MemberCaseService.updateCaseStatus(caseId, newStatus);

      if (result.success) {
        setCaseData(result.case);
        await MemberCaseService.addTimelineEvent(
          caseId,
          user.id,
          'status_change',
          `Status updated to ${newStatus}`
        );
        loadCaseDetails();
        Alert.alert('Success', `Case status updated to ${newStatus}`);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update case status');
    } finally {
      setUpdating(false);
    }
  };

  const renderTimelineItem = ({ item, index }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineMarker}>
        <View style={styles.timelineCircle}>
          <Text style={styles.timelineIcon}>
            {item.event_type === 'update' ? '📝' : '✓'}
          </Text>
        </View>
        {index < timeline.length - 1 && <View style={styles.timelineLine} />}
      </View>

      <View style={styles.timelineContent}>
        <Text style={styles.timelineEventType}>
          {item.event_type === 'update' ? 'Case Update' : 'Status Change'}
        </Text>
        <Text style={styles.timelineDescription}>{item.description}</Text>
        <Text style={styles.timelineDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderParticipantItem = ({ item }) => (
    <View style={styles.participantCard}>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{item.participant_name}</Text>
        <Text style={styles.participantType}>{item.participant_type}</Text>
        {item.role_description && (
          <Text style={styles.participantRole}>{item.role_description}</Text>
        )}
      </View>
      {item.contact_info && (
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={18} color="#007AFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading case details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Case not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Details</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Case Title & Status */}
        <View style={styles.caseHeader}>
          <Text style={styles.caseName}>{caseData.name}</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusEmoji}>{statusEmojis[caseData.status]}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors[caseData.status] },
              ]}
            >
              <Text style={styles.statusText}>{caseData.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Case Description */}
        {caseData.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{caseData.description}</Text>
          </View>
        )}

        {/* Progress Tracker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Case Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getProgressPercentage()}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(getProgressPercentage())}% Complete
            </Text>
          </View>

          {/* Status Steps */}
          <View style={styles.stepsContainer}>
            {statusSteps.map((step, index) => (
              <TouchableOpacity
                key={step}
                style={styles.stepItem}
                onPress={() => handleStatusChange(step)}
                disabled={updating}
              >
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor:
                        statusSteps.indexOf(caseData.status) >= index
                          ? statusColors[step]
                          : '#E5E5EA',
                    },
                  ]}
                >
                  {statusSteps.indexOf(caseData.status) > index ? (
                    <Text style={styles.stepCheckmark}>✓</Text>
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                <Text style={styles.stepLabel}>{step}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Case Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Case Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Filed:</Text>
            <Text style={styles.infoValue}>
              {new Date(caseData.escalation_date).toLocaleDateString()}
            </Text>
          </View>
          {caseData.body_id && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Organization:</Text>
              <Text style={styles.infoValue}>Organization ID: {caseData.body_id}</Text>
            </View>
          )}
        </View>

        {/* Participants */}
        {participants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participants</Text>
            <FlatList
              data={participants}
              renderItem={renderParticipantItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          </View>
        )}

        {/* Add Update Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Case Update</Text>
          <TextInput
            style={styles.updateInput}
            placeholder="Describe the latest development..."
            placeholderTextColor="#999"
            value={updateDescription}
            onChangeText={setUpdateDescription}
            multiline
            numberOfLines={3}
            editable={!updating}
          />
          <TouchableOpacity
            style={[styles.addButton, updating && styles.addButtonDisabled]}
            onPress={handleAddUpdate}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Update</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Case Timeline</Text>
          {timeline.length > 0 ? (
            <FlatList
              data={timeline}
              renderItem={renderTimelineItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyTimelineText}>
              No updates yet. Be the first to add one!
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  caseHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  caseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusEmoji: {
    fontSize: 24,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCheckmark: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  participantType: {
    fontSize: 12,
    color: '#8E8E93',
  },
  participantRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  contactButton: {
    padding: 8,
  },
  updateInput: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineMarker: {
    alignItems: 'center',
    marginRight: 14,
  },
  timelineCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIcon: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineEventType: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  timelineDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 11,
    color: '#8E8E93',
  },
  emptyTimelineText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
