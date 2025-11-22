import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BodyMemberService } from '../../utils/bodyMemberService';


const QnASessionDetailScreen = ({ route, navigation }) => {
  const { sessionId, bodyId } = route.params;


  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    loadSessionDetail();
  }, [sessionId]);


  const loadSessionDetail = async () => {
    try {
      const [sessionResult, questionsResult] = await Promise.all([
        BodyMemberService.getQnASessions(bodyId, null),
        BodyMemberService.getSessionQuestions(sessionId)
      ]);


      if (sessionResult.success) {
        const foundSession = sessionResult.sessions.find(s => s.id === sessionId);
        setSession(foundSession);
      }


      if (questionsResult.success) {
        setQuestions(questionsResult.questions);
      }
    } catch (error) {
      console.error('Error loading session detail:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadSessionDetail();
  };


  const handleSubmitQuestion = async () => {
    if (questionText.trim().length < 10) {
      Alert.alert('Error', 'Question must be at least 10 characters');
      return;
    }


    setSubmitting(true);
    try {
      const result = await BodyMemberService.submitQuestion(
        sessionId,
        questionText.trim(),
        isAnonymous
      );


      if (result.success) {
        setQuestionText('');
        Alert.alert('Success', 'Question submitted successfully');
        loadSessionDetail();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };


  const handleUpvote = async (questionId) => {
    const result = await BodyMemberService.upvoteQuestion(questionId);
    if (result.success) {
      loadSessionDetail();
    }
  };


  const renderQuestion = ({ item }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {item.is_anonymous ? 'Anonymous' : item.member?.full_name}
          </Text>
          {item.status === 'answered' && (
            <View style={styles.answeredBadge}>
              <Text style={styles.answeredText}>✓ ANSWERED</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.upvoteButton}
          onPress={() => handleUpvote(item.id)}
        >
          <Text style={styles.upvoteIcon}>👍</Text>
          <Text style={styles.upvoteCount}>{item.upvotes_count || 0}</Text>
        </TouchableOpacity>
      </View>


      <Text style={styles.questionText}>{item.question}</Text>


      {item.answer_text && (
        <View style={styles.answerContainer}>
          <View style={styles.answerHeader}>
            <Text style={styles.answerLabel}>Answer:</Text>
            {item.answerer && (
              <Text style={styles.answererName}>by {item.answerer.full_name}</Text>
            )}
          </View>
          <Text style={styles.answerText}>{item.answer_text}</Text>
          {item.answered_at && (
            <Text style={styles.answerTime}>
              {new Date(item.answered_at).toLocaleString()}
            </Text>
          )}
        </View>
      )}


      <Text style={styles.questionTime}>
        Asked {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );


  if (loading || !session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            {session.description && (
              <Text style={styles.sessionDescription}>{session.description}</Text>
            )}
            
            <View style={styles.sessionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailText}>
                  {new Date(session.scheduled_start).toLocaleString()}
                </Text>
              </View>
              {session.location && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>{session.location}</Text>
                </View>
              )}
            </View>
          </View>


          {/* Submit Question */}
          <View style={styles.submitSection}>
            <Text style={styles.submitLabel}>Ask a Question</Text>
            <TextInput
              style={styles.questionInput}
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="What would you like to know?"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            
            <View style={styles.anonymousToggle}>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor={isAnonymous ? '#2E7D32' : '#f4f3f4'}
              />
              <Text style={styles.anonymousLabel}>Ask anonymously</Text>
            </View>


            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitQuestion}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Question'}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Questions List */}
          <View style={styles.questionsSection}>
            <Text style={styles.questionsTitle}>
              Questions ({questions.length})
            </Text>
            {questions.length === 0 ? (
              <View style={styles.emptyQuestions}>
                <Text style={styles.emptyText}>No questions yet</Text>
                <Text style={styles.emptySubtext}>Be the first to ask!</Text>
              </View>
            ) : (
              <FlatList
                data={questions}
                renderItem={renderQuestion}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </View>
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
  sessionInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  sessionDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 16,
  },
  sessionDetails: {
    gap: 8,
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
  submitSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  questionInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    marginBottom: 12,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  anonymousLabel: {
    fontSize: 15,
    color: '#333333',
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#0066FF',
    padding: 14,
    borderRadius: 8,
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
  questionsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  answeredBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  answeredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  upvoteIcon: {
    fontSize: 16,
  },
  upvoteCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  questionText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 12,
  },
  answerContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  answererName: {
    fontSize: 12,
    color: '#666666',
  },
  answerText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 6,
  },
  answerTime: {
    fontSize: 11,
    color: '#999999',
  },
  questionTime: {
    fontSize: 12,
    color: '#999999',
  },
  emptyQuestions: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
  },
});


export default QnASessionDetailScreen;
