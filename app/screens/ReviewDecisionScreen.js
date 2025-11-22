import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { DecisionReviewService } from '../../utils/decisionReviewService';


const ReviewDecisionScreen = ({ route, navigation }) => {
  const { decisionId } = route.params;
  
  const [decision, setDecision] = useState(null);
  const [canAppeal, setCanAppeal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [supportingEvidence, setSupportingEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadDecision();
  }, [decisionId]);


  const loadDecision = async () => {
    try {
      const result = await DecisionReviewService.getDecisionById(decisionId);
      if (result.success) {
        setDecision(result.decision);
      }


      const appealResult = await DecisionReviewService.canAppealDecision(decisionId);
      if (appealResult.success) {
        setCanAppeal(appealResult.canAppeal);
      }
    } catch (error) {
      console.error('Error loading decision:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmitAppeal = async () => {
    if (appealReason.trim().length < 50) {
      Alert.alert('Error', 'Appeal reason must be at least 50 characters');
      return;
    }


    Alert.alert(
      'Submit Appeal',
      'Submit this appeal for admin review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await DecisionReviewService.createAppeal(
                decisionId,
                appealReason.trim(),
                supportingEvidence.trim() || null
              );


              if (result.success) {
                Alert.alert(
                  'Success',
                  'Your appeal has been submitted and will be reviewed by an admin.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              console.error('Error submitting appeal:', error);
              Alert.alert('Error', 'Failed to submit appeal');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };


  const getDecisionColor = (decisionType) => {
    switch (decisionType) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'suspended': return '#FF9800';
      case 'deleted': return '#F44336';
      case 'warning': return '#FFC107';
      default: return '#9E9E9E';
    }
  };


  if (loading || !decision) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }


  const decisionColor = getDecisionColor(decision.decision_type);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={[styles.decisionSummary, { borderLeftColor: decisionColor }]}>
          <Text style={[styles.decisionType, { color: decisionColor }]}>
            {decision.decision_type.toUpperCase()}
          </Text>
          <Text style={styles.decisionTarget}>
            {decision.target_type.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.decisionDate}>
            {new Date(decision.created_at).toLocaleDateString()}
          </Text>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision Reason</Text>
          <Text style={styles.reasonText}>{decision.reason}</Text>
          
          {decision.details && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Details</Text>
              <Text style={styles.detailsText}>{decision.details}</Text>
            </>
          )}
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Information</Text>
          <Text style={styles.infoText}>
            Decision by: {decision.admin?.full_name || 'Admin'}
          </Text>
          {decision.appeal_deadline && (
            <Text style={styles.infoText}>
              Appeal deadline: {new Date(decision.appeal_deadline).toLocaleDateString()}
            </Text>
          )}
        </View>


        {canAppeal ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Submit Appeal</Text>
              <Text style={styles.appealInfo}>
                If you believe this decision was made in error, you can submit an appeal 
                with your reasoning and supporting evidence.
              </Text>


              <Text style={styles.label}>Appeal Reason *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={appealReason}
                onChangeText={setAppealReason}
                placeholder="Explain why you believe this decision should be reconsidered..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{appealReason.length}/1000</Text>


              <Text style={styles.label}>Supporting Evidence (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={supportingEvidence}
                onChangeText={setSupportingEvidence}
                placeholder="Provide any links, references, or additional context..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{supportingEvidence.length}/1000</Text>
            </View>


            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitAppeal}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Appeal'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.noAppealContainer}>
              <Text style={styles.noAppealIcon}>🚫</Text>
              <Text style={styles.noAppealTitle}>Appeal Not Available</Text>
              <Text style={styles.noAppealText}>
                {decision.is_appealable 
                  ? 'The appeal deadline has passed for this decision.'
                  : 'This decision is not appealable.'}
              </Text>
            </View>
          </View>
        )}


        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    fontSize: 16,
    color: '#666666',
  },
  decisionSummary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  decisionType: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  decisionTarget: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  decisionDate: {
    fontSize: 12,
    color: '#999999',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  detailsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  appealInfo: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noAppealContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noAppealIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noAppealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  noAppealText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});


export default ReviewDecisionScreen;
