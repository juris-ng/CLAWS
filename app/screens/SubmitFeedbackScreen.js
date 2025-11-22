import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import {
  Alert,
  Platform,
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

const SubmitFeedbackScreen = ({ route, navigation }) => {
  const { bodyId, bodyName } = route.params;

  const [feedbackType, setFeedbackType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // NEW: Dynamic title based on feedback type
  const getTitle = () => {
    if (feedbackType === 'idea') {
      return 'Submit Your Idea';
    }
    return 'Submit Feedback';
  };

  // NEW: Dynamic placeholder based on feedback type
  const getSubjectPlaceholder = () => {
    if (feedbackType === 'idea') {
      return 'Brief summary of your idea...';
    }
    return 'Brief summary of your feedback...';
  };

  const getDescriptionPlaceholder = () => {
    if (feedbackType === 'idea') {
      return 'Describe your idea in detail. What problem does it solve? How would it work?';
    }
    return 'Please provide detailed feedback...';
  };

  const validateForm = () => {
    if (subject.trim().length < 5) {
      Alert.alert('Error', 'Subject must be at least 5 characters');
      return false;
    }
    if (description.trim().length < 20) {
      Alert.alert('Error', 'Description must be at least 20 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const feedbackData = {
        feedbackType,
        subject: subject.trim(),
        description: description.trim(),
        urgency,
        isAnonymous
      };

      const result = await BodyMemberService.submitFeedback(bodyId, feedbackData);

      if (result.success) {
        // NEW: Dynamic success message
        const successMessage = feedbackType === 'idea' 
          ? 'Your idea has been submitted successfully. The organization will review it soon!'
          : 'Your feedback has been submitted successfully.';
        
        Alert.alert(
          'Thank You!',
          successMessage,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          {/* MODIFIED: Dynamic title */}
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>to {bodyName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Feedback Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={feedbackType}
              onValueChange={setFeedbackType}
              style={styles.picker}
            >
              <Picker.Item label="💬 General Feedback" value="feedback" />
              <Picker.Item label="🎯 Service Feedback" value="service" />
              <Picker.Item label="📋 Program Feedback" value="program" />
              <Picker.Item label="❌ Complaint" value="complaint" />
              <Picker.Item label="💡 Suggestion" value="suggestion" />
              {/* NEW: Idea option */}
              <Picker.Item label="🚀 Idea/Innovation" value="idea" />
              <Picker.Item label="👍 Compliment" value="compliment" />
            </Picker>
          </View>
        </View>

        {/* NEW: Show different info box for ideas */}
        {feedbackType === 'idea' && (
          <View style={styles.ideaInfoBox}>
            <Text style={styles.ideaInfoIcon}>💡</Text>
            <View style={styles.ideaInfoContent}>
              <Text style={styles.ideaInfoTitle}>Share Your Innovative Idea!</Text>
              <Text style={styles.ideaInfoText}>
                Help improve services by sharing creative solutions and innovative approaches.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Urgency Level *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={urgency}
              onValueChange={setUrgency}
              style={styles.picker}
            >
              <Picker.Item label="⬇️ Low" value="low" />
              <Picker.Item label="➡️ Normal" value="normal" />
              <Picker.Item label="⬆️ High" value="high" />
              <Picker.Item label="🚨 Urgent" value="urgent" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder={getSubjectPlaceholder()}
            placeholderTextColor="#999999"
            maxLength={200}
          />
          <Text style={styles.charCount}>{subject.length}/200</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={getDescriptionPlaceholder()}
            placeholderTextColor="#999999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{description.length}/2000</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.anonymousToggle}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Submit Anonymously</Text>
              <Text style={styles.toggleDescription}>
                Your identity will be hidden from the organization
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={isAnonymous ? '#2E7D32' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            {/* MODIFIED: Dynamic info text */}
            {feedbackType === 'idea' 
              ? 'Your ideas can drive innovation and positive change. Organizations value creative input from members.'
              : 'Your feedback helps organizations improve their services and programs.'
            }
            {isAnonymous ? ' Anonymous submissions are still reviewed seriously.' : 
            ' Providing your identity may help with follow-up responses.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {/* MODIFIED: Dynamic button text */}
            {submitting 
              ? 'Submitting...' 
              : feedbackType === 'idea' 
                ? 'Submit Idea' 
                : 'Submit Feedback'
            }
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
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
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  anonymousToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#666666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0066FF',
    lineHeight: 18,
  },
  // NEW: Idea Info Box Styles
  ideaInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  ideaInfoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  ideaInfoContent: {
    flex: 1,
  },
  ideaInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  ideaInfoText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
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

export default SubmitFeedbackScreen;
