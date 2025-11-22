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
import { BodyMemberService } from '../../utils/bodyMemberService';


const TakeSurveyScreen = ({ route, navigation }) => {
  const { surveyId, bodyId } = route.params;


  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    loadSurvey();
  }, [surveyId]);


  const loadSurvey = async () => {
    try {
      const result = await BodyMemberService.getSurveyWithQuestions(surveyId);
      if (result.success) {
        setSurvey(result.survey);
        // Initialize responses
        const initialResponses = {};
        result.survey.questions.forEach(q => {
          initialResponses[q.id] = '';
        });
        setResponses(initialResponses);
      }
    } catch (error) {
      console.error('Error loading survey:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleResponseChange = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };


  const validateResponses = () => {
    for (const question of survey.questions) {
      if (question.is_required && !responses[question.id]) {
        Alert.alert('Required Question', `Please answer: ${question.question_text}`);
        return false;
      }
    }
    return true;
  };


  const handleSubmit = async () => {
    if (!validateResponses()) return;


    setSubmitting(true);
    try {
      const result = await BodyMemberService.submitSurveyResponse(
        surveyId,
        responses,
        survey.is_anonymous
      );


      if (result.success) {
        Alert.alert(
          'Thank You!',
          'Your response has been submitted successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };


  const renderQuestion = (question) => {
    switch (question.question_type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={responses[question.id]}
            onChangeText={(text) => handleResponseChange(question.id, text)}
            placeholder="Your answer..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );


      case 'multiple_choice':
        return (
          <View style={styles.optionsContainer}>
            {question.options?.choices?.map((choice, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  responses[question.id] === choice && styles.optionButtonSelected
                ]}
                onPress={() => handleResponseChange(question.id, choice)}
              >
                <View style={[
                  styles.radio,
                  responses[question.id] === choice && styles.radioSelected
                ]}>
                  {responses[question.id] === choice && (
                    <View style={styles.radioDot} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  responses[question.id] === choice && styles.optionTextSelected
                ]}>
                  {choice}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );


      case 'rating':
        return (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingButton}
                onPress={() => handleResponseChange(question.id, rating.toString())}
              >
                <Text style={[
                  styles.ratingStar,
                  parseInt(responses[question.id]) >= rating && styles.ratingStarSelected
                ]}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );


      case 'yes_no':
        return (
          <View style={styles.yesNoContainer}>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                responses[question.id] === 'yes' && styles.yesNoButtonSelected
              ]}
              onPress={() => handleResponseChange(question.id, 'yes')}
            >
              <Text style={[
                styles.yesNoText,
                responses[question.id] === 'yes' && styles.yesNoTextSelected
              ]}>
                ✓ Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                responses[question.id] === 'no' && styles.yesNoButtonSelected
              ]}
              onPress={() => handleResponseChange(question.id, 'no')}
            >
              <Text style={[
                styles.yesNoText,
                responses[question.id] === 'no' && styles.yesNoTextSelected
              ]}>
                ✕ No
              </Text>
            </TouchableOpacity>
          </View>
        );


      case 'scale':
        return (
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabel}>1</Text>
              <Text style={styles.scaleLabel}>10</Text>
            </View>
            <View style={styles.scaleButtons}>
              {[...Array(10)].map((_, index) => (
                <TouchableOpacity
                  key={index + 1}
                  style={[
                    styles.scaleButton,
                    responses[question.id] === (index + 1).toString() && styles.scaleButtonSelected
                  ]}
                  onPress={() => handleResponseChange(question.id, (index + 1).toString())}
                >
                  <Text style={[
                    styles.scaleButtonText,
                    responses[question.id] === (index + 1).toString() && styles.scaleButtonTextSelected
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );


      default:
        return null;
    }
  };


  if (loading || !survey) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading survey...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{survey.title}</Text>
          {survey.description && (
            <Text style={styles.description}>{survey.description}</Text>
          )}
          {survey.is_anonymous && (
            <View style={styles.anonymousBadge}>
              <Text style={styles.anonymousText}>🔒 Your responses are anonymous</Text>
            </View>
          )}
        </View>


        {survey.questions.map((question, index) => (
          <View key={question.id} style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Q{index + 1}</Text>
              {question.is_required && (
                <Text style={styles.requiredBadge}>* Required</Text>
              )}
            </View>
            <Text style={styles.questionText}>{question.question_text}</Text>
            {renderQuestion(question)}
          </View>
        ))}


        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </Text>
        </TouchableOpacity>


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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 12,
  },
  anonymousBadge: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  anonymousText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  requiredBadge: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0066FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#0066FF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066FF',
  },
  optionText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },
  optionTextSelected: {
    color: '#0066FF',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ratingButton: {
    padding: 8,
  },
  ratingStar: {
    fontSize: 32,
    opacity: 0.3,
  },
  ratingStarSelected: {
    opacity: 1,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0066FF',
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  yesNoTextSelected: {
    color: '#0066FF',
  },
  scaleContainer: {
    gap: 8,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scaleButtonSelected: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  scaleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  scaleButtonTextSelected: {
    color: '#FFFFFF',
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
  footer: {
    height: 40,
  },
});


export default TakeSurveyScreen;
