import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { supabase } from '../../supabase';
import { CaseService } from '../../utils/caseService';
import { LawyerService } from '../../utils/lawyerService';

const CreateCaseScreen = ({ navigation }) => {
  const [practiceAreas, setPracticeAreas] = useState([]);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseType, setCaseType] = useState('civil');
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('english');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserData();
    loadPracticeAreas();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPracticeAreas = async () => {
    const result = await LawyerService.getPracticeAreas();
    if (result.success) {
      setPracticeAreas(result.practiceAreas || []);
    }
  };

  const validateForm = () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create a case');
      return false;
    }

    if (!selectedPracticeArea) {
      Alert.alert('Error', 'Please select a practice area');
      return false;
    }

    if (caseTitle.trim().length < 10) {
      Alert.alert('Error', 'Case title must be at least 10 characters');
      return false;
    }

    if (caseDescription.trim().length < 50) {
      Alert.alert('Error', 'Case description must be at least 50 characters');
      return false;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please provide your location');
      return false;
    }

    if (!contactPhone.trim()) {
      Alert.alert('Error', 'Please provide a contact phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const caseData = {
        client_id: userId,
        practice_area_id: selectedPracticeArea,
        case_title: caseTitle.trim(),
        description: caseDescription.trim(),
        case_type: caseType,
        urgency_level: urgencyLevel,
        location: location.trim(),
        contact_phone: contactPhone.trim(),
        preferred_language: preferredLanguage,
        status: 'open',
      };

      const result = await CaseService.createCase(caseData);

      if (result.success) {
        Alert.alert(
          'Success! 🎉',
          'Your case has been created successfully. Lawyers will be notified and can choose to accept your case.',
          [
            {
              text: 'View Case',
              onPress: () =>
                navigation.replace('CaseDetail', {
                  caseId: result.case.id,
                }),
            },
            {
              text: 'Find Lawyers',
              onPress: () => navigation.replace('LawyersList'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create case');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      Alert.alert('Error', 'Failed to create case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Create New Case</Text>
              <Text style={styles.subtitle}>Provide details about your legal matter</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* Practice Area */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Practice Area <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedPracticeArea}
                  onValueChange={setSelectedPracticeArea}
                  style={styles.picker}
                >
                  <Picker.Item label="Select practice area..." value="" />
                  {practiceAreas.map((area) => (
                    <Picker.Item
                      key={area.id}
                      label={`${area.icon || '⚖️'} ${area.name}`}
                      value={area.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Case Type */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Case Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={caseType}
                  onValueChange={setCaseType}
                  style={styles.picker}
                >
                  <Picker.Item label="⚖️ Civil" value="civil" />
                  <Picker.Item label="🚨 Criminal" value="criminal" />
                  <Picker.Item label="🏛️ Administrative" value="administrative" />
                  <Picker.Item label="📜 Constitutional" value="constitutional" />
                  <Picker.Item label="👥 Family" value="family" />
                  <Picker.Item label="💼 Corporate" value="corporate" />
                </Picker>
              </View>
            </View>

            {/* Urgency Level */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Urgency Level <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.urgencyButtons}>
                {['low', 'medium', 'high'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.urgencyButton,
                      urgencyLevel === level && styles.urgencyButtonActive,
                    ]}
                    onPress={() => setUrgencyLevel(level)}
                  >
                    <Text
                      style={[
                        styles.urgencyButtonText,
                        urgencyLevel === level && styles.urgencyButtonTextActive,
                      ]}
                    >
                      {level.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Case Title */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Case Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={caseTitle}
                onChangeText={setCaseTitle}
                placeholder="Brief, descriptive title (min 10 characters)"
                placeholderTextColor="#999999"
                maxLength={200}
              />
              <Text style={styles.helperText}>
                Example: "Wrongful Termination from Employment"
              </Text>
            </View>

            {/* Case Description */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Case Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={caseDescription}
                onChangeText={setCaseDescription}
                placeholder="Provide detailed information: What happened? When? Who was involved? What outcome do you seek?"
                placeholderTextColor="#999999"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={styles.charCount}>{caseDescription.length}/2000</Text>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Your Location <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, County or Region"
                placeholderTextColor="#999999"
                maxLength={100}
              />
            </View>

            {/* Contact Phone */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Contact Phone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+254 712 345 678"
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            {/* Preferred Language */}
            <View style={styles.section}>
              <Text style={styles.label}>Preferred Language</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={preferredLanguage}
                  onValueChange={setPreferredLanguage}
                  style={styles.picker}
                >
                  <Picker.Item label="🇬🇧 English" value="english" />
                  <Picker.Item label="🇰🇪 Swahili" value="swahili" />
                  <Picker.Item label="🇰🇪 Other" value="other" />
                </Picker>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>What happens next?</Text>
                <Text style={styles.infoText}>
                  • Your case will be visible to verified lawyers{'\n'}
                  • Lawyers can review and choose to accept your case{'\n'}
                  • You'll be notified when a lawyer accepts{'\n'}
                  • You can also browse and directly contact lawyers
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Creating Case...' : '✓ Create Case'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#4CAF50',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  formContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 6,
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  urgencyButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  urgencyButtonTextActive: {
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
  },
});

export default CreateCaseScreen;
