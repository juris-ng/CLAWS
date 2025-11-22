import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

// CLAWS Brand Colors - Blue Dominant
const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  secondary: '#FF6B35',
  orange: '#FF9800',
  orangeDark: '#F57C00',
  orangeLight: '#FFE0B2',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  error: '#F44336',
  success: '#4CAF50',
};

const RegisterLawyerScreen = ({ navigation }) => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Account Setup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Professional Credentials
  const [barNumber, setBarNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [lawFirm, setLawFirm] = useState('');

  // Step 3: Practice Details
  const [practiceAreas, setPracticeAreas] = useState([]);
  const [selectedPracticeAreas, setSelectedPracticeAreas] = useState([]);
  const [officeAddress, setOfficeAddress] = useState('');
  const [officePhone, setOfficePhone] = useState('');

  // Step 4: Personal Information & Documents
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [credentials, setCredentials] = useState([]);

  // Modal States
  const [showPracticeAreasModal, setShowPracticeAreasModal] = useState(false);
  const [practiceAreaSearchQuery, setPracticeAreaSearchQuery] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPracticeAreas();
  }, []);

  const loadPracticeAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_areas')
        .select('*')
        .order('name');

      if (error) throw error;
      setPracticeAreas(data || []);
    } catch (error) {
      console.error('Error loading practice areas:', error);
    }
  };

  const filteredPracticeAreas = practiceAreas.filter((area) =>
    area.name.toLowerCase().includes(practiceAreaSearchQuery.toLowerCase())
  );

  const togglePracticeArea = (areaId) => {
    if (selectedPracticeAreas.includes(areaId)) {
      setSelectedPracticeAreas(selectedPracticeAreas.filter((id) => id !== areaId));
    } else {
      if (selectedPracticeAreas.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 practice areas');
        return;
      }
      setSelectedPracticeAreas([...selectedPracticeAreas, areaId]);
    }
  };

  const removePracticeArea = (areaId) => {
    setSelectedPracticeAreas(selectedPracticeAreas.filter((id) => id !== areaId));
  };

  const pickCredentialDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (result.type === 'success') {
        setCredentials([...credentials, result]);
        Alert.alert('Success', 'Document added');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeCredential = (index) => {
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return { label: 'Weak', color: COLORS.error };
    if (strength === 2) return { label: 'Fair', color: COLORS.orange };
    if (strength === 3) return { label: 'Good', color: COLORS.primary };
    return { label: 'Strong', color: COLORS.success };
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!email.trim() || !email.includes('@')) {
          Alert.alert('Error', 'Please enter a valid email address');
          return false;
        }
        if (!password || password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return false;
        }
        return true;

      case 2:
        if (barNumber.trim().length < 3) {
          Alert.alert('Error', 'Please enter your bar registration number');
          return false;
        }
        return true;

      case 3:
        if (selectedPracticeAreas.length === 0) {
          Alert.alert('Error', 'Please select at least one practice area');
          return false;
        }
        return true;

      case 4:
        if (!fullName.trim()) {
          Alert.alert('Error', 'Please enter your full name');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const uploadCredentials = async (userId) => {
    if (credentials.length === 0) return;

    try {
      for (const cred of credentials) {
        const fileExt = cred.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `credentials/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, cred);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);

        await supabase.from('lawyer_credentials').insert({
          lawyer_id: userId,
          credential_type: 'license',
          document_url: urlData.publicUrl,
          document_name: cred.name,
          verification_status: 'pending',
        });
      }
    } catch (error) {
      console.error('Error uploading credentials:', error);
    }
  };

  const addSpecializations = async (userId) => {
    if (selectedPracticeAreas.length === 0) return;

    try {
      const specializationsData = selectedPracticeAreas.map((areaId) => ({
        lawyer_id: userId,
        practice_area_id: areaId,
        expertise_level: 'intermediate',
      }));

      await supabase.from('lawyer_specializations').insert(specializationsData);
    } catch (error) {
      console.error('Error adding specializations:', error);
    }
  };

  // ✅ FIXED handleSubmit - NO SIGN OUT + DIRECT NAVIGATION
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    Alert.alert(
      'Register Lawyer Account',
      'Create account and submit profile for verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              // Step 1: Create Supabase Auth User
              const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                  data: {
                    user_type: 'lawyer',
                    full_name: fullName.trim(),
                  },
                },
              });

              if (authError) throw authError;
              if (!authData.user) throw new Error('Failed to create user account');

              const userId = authData.user.id;
              console.log('✅ Auth user created:', userId);

              // Step 2: Create Lawyer Profile
              const { error: profileError } = await supabase.from('lawyers').insert([
                {
                  id: userId,
                  email: email.trim(),
                  full_name: fullName.trim(),
                  phone_number: phoneNumber.trim() || null,
                  bar_number: barNumber.trim(),
                  license_number: licenseNumber.trim() || null,
                  law_firm: lawFirm.trim() || null,
                  office_address: officeAddress.trim() || null,
                  office_phone: officePhone.trim() || null,
                  verification_status: 'pending',
                  is_verified: false,
                  is_available: true,
                  rating: 0,
                  points: 0,
                },
              ]);

              if (profileError) throw profileError;
              console.log('✅ Lawyer profile created successfully');

              // Step 3: Add Practice Specializations
              await addSpecializations(userId);
              console.log('✅ Specializations added');

              // Step 4: Upload Credentials
              await uploadCredentials(userId);
              console.log('✅ Credentials uploaded');

              // ✅ DON'T SIGN OUT - User stays logged in
              // ❌ REMOVED: await supabase.auth.signOut();

              // ✅ Navigate directly to Lawyer Dashboard using reset
              Alert.alert(
                'Success! 🎉',
                'Lawyer account created successfully!\n\nWelcome to CLAWS!',
                [
                  {
                    text: 'Get Started',
                    onPress: () => {
                      // Reset navigation stack and go to Lawyer Dashboard
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'LawyerTabs' }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('❌ Registration error:', error);
              Alert.alert('Registration Error', error.message || 'Failed to register lawyer account');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const passwordStrength = getPasswordStrength();

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressStepContainer}>
          <View style={[styles.progressDot, step <= currentStep && styles.progressDotActive]}>
            {step < currentStep ? (
              <Ionicons name="checkmark" size={14} color={COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.progressDotText,
                  step <= currentStep && styles.progressDotTextActive,
                ]}
              >
                {step}
              </Text>
            )}
          </View>
          {step < totalSteps && (
            <View
              style={[
                styles.progressLine,
                step < currentStep && styles.progressLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Account Setup', subtitle: 'Create your login credentials' },
      { number: 2, title: 'Professional Credentials', subtitle: 'Your qualifications' },
      { number: 3, title: 'Practice & Location', subtitle: 'Areas of expertise' },
      { number: 4, title: 'Personal Info', subtitle: 'Complete your profile' },
    ];

    return (
      <View style={styles.stepIndicatorContainer}>
        <Text style={styles.stepTitle}>{steps[currentStep - 1].title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep - 1].subtitle}</Text>
      </View>
    );
  };

  const renderPracticeAreasModal = () => (
    <Modal
      visible={showPracticeAreasModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPracticeAreasModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Practice Areas</Text>
            <TouchableOpacity onPress={() => setShowPracticeAreasModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search practice areas..."
            placeholderTextColor={COLORS.mediumGray}
            value={practiceAreaSearchQuery}
            onChangeText={setPracticeAreaSearchQuery}
          />

          <Text style={styles.modalSubtitle}>{selectedPracticeAreas.length}/5 selected</Text>

          <FlatList
            data={filteredPracticeAreas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isSelected = selectedPracticeAreas.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => togglePracticeArea(item.id)}
                >
                  <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                    {item.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={styles.modalDoneButton}
            onPress={() => setShowPracticeAreasModal(false)}
          >
            <Text style={styles.modalDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="lawyer@email.com"
          placeholderTextColor={COLORS.mediumGray}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          placeholderTextColor={COLORS.mediumGray}
          secureTextEntry
        />
        {password.length > 0 && (
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
            Strength: {passwordStrength.label}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          placeholderTextColor={COLORS.mediumGray}
          secureTextEntry
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>Use your professional email for verification</Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bar Registration Number *</Text>
        <TextInput
          style={styles.input}
          value={barNumber}
          onChangeText={setBarNumber}
          placeholder="e.g., BAR123456"
          placeholderTextColor={COLORS.mediumGray}
          autoCapitalize="characters"
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>License Number</Text>
        <TextInput
          style={styles.input}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="Optional"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Law Firm/Organization</Text>
        <TextInput
          style={styles.input}
          value={lawFirm}
          onChangeText={setLawFirm}
          placeholder="Optional"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={200}
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>Your credentials will be verified by our team</Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Practice Areas * (Select up to 5)</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowPracticeAreasModal(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {selectedPracticeAreas.length === 0
              ? 'Select practice areas'
              : `${selectedPracticeAreas.length} selected`}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        {selectedPracticeAreas.length > 0 && (
          <View style={styles.selectedAreasContainer}>
            {selectedPracticeAreas.map((areaId) => {
              const area = practiceAreas.find((a) => a.id === areaId);
              return (
                <View key={areaId} style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>{area?.name}</Text>
                  <TouchableOpacity onPress={() => removePracticeArea(areaId)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Office Address</Text>
        <TextInput
          style={styles.input}
          value={officeAddress}
          onChangeText={setOfficeAddress}
          placeholder="Optional"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={300}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Office Phone</Text>
        <TextInput
          style={styles.input}
          value={officePhone}
          onChangeText={setOfficePhone}
          placeholder="Optional"
          placeholderTextColor={COLORS.mediumGray}
          keyboardType="phone-pad"
          maxLength={50}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="John Doe"
          placeholderTextColor={COLORS.mediumGray}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+254 XXX XXX XXX"
          placeholderTextColor={COLORS.mediumGray}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Upload Credentials (Optional)</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickCredentialDocument}>
          <Ionicons name="document-attach" size={20} color={COLORS.primary} />
          <Text style={styles.uploadButtonText}>
            Add License/Certificate ({credentials.length})
          </Text>
        </TouchableOpacity>

        {credentials.map((cred, index) => (
          <View key={index} style={styles.credentialItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.credentialText}>{cred.name}</Text>
            <TouchableOpacity onPress={() => removeCredential(index)}>
              <Ionicons name="close-circle" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="document-text" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>Upload documents for faster verification</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header with Blue Background */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Register as Lawyer</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Render Current Step */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < totalSteps ? (
              <TouchableOpacity
                style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </Text>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Login Link */}
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Terms & Privacy - Single Line */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => {/* Navigate to Terms */}}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => {/* Navigate to Privacy */}}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* All Modals */}
      {renderPracticeAreasModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.primaryLight,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingBottom: 20,
    paddingHorizontal: 32,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  progressDotActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressDotTextActive: {
    color: COLORS.white,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 6,
  },
  progressLineActive: {
    backgroundColor: COLORS.orange,
  },
  stepIndicatorContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.darkGray,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  strengthLabel: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  selectedAreasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 8,
  },
  credentialText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.darkGray,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orange,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  termsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  searchInput: {
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.darkGray,
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalDoneButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default RegisterLawyerScreen;
