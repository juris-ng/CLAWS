import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
};

const RegisterBodyScreen = ({ navigation }) => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Account Setup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Organization Identity
  const [name, setName] = useState('');
  const [bodyType, setBodyType] = useState('government');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Focus & Location
  const [focusAreas, setFocusAreas] = useState([]);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [address, setAddress] = useState('');

  // Step 4: Verification Details
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [userTitle, setUserTitle] = useState('');

  // Modal States
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showBodyTypeModal, setShowBodyTypeModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);

  // Search Queries
  const [focusSearchQuery, setFocusSearchQuery] = useState('');
  const [bodyTypeSearchQuery, setBodyTypeSearchQuery] = useState('');
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [positionSearchQuery, setPositionSearchQuery] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const bodyTypes = [
    { value: 'government', label: 'Government Agency', icon: 'business' },
    { value: 'ngo', label: 'NGO / Non-Profit', icon: 'heart' },
    { value: 'civil_society', label: 'Civil Society Organization', icon: 'people' },
    { value: 'educational', label: 'Educational Institution', icon: 'school' },
    { value: 'corporate', label: 'Corporate / Business', icon: 'briefcase' },
    { value: 'media', label: 'Media Organization', icon: 'tv' },
    { value: 'advocacy', label: 'Advocacy Group', icon: 'megaphone' },
    { value: 'community', label: 'Community Organization', icon: 'home' },
    { value: 'religious', label: 'Religious Organization', icon: 'star' },
    { value: 'other', label: 'Other', icon: 'ellipse' },
  ];

  const countries = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Other'];

  const allFocusAreas = [
    'Human Rights',
    'Environmental Protection',
    'Education',
    'Healthcare',
    'Economic Development',
    'Social Justice',
    'Gender Equality',
    'Child Welfare',
    'Good Governance',
    'Anti-Corruption',
    'Community Development',
    'Disability Rights',
    'Youth Empowerment',
    'Arts & Culture',
    'Technology & Innovation',
  ];

  const positionOptions = [
    'Director',
    'Executive Director',
    'CEO',
    'Managing Director',
    'Communications Officer',
    'Public Relations Officer',
    'Program Manager',
    'Project Coordinator',
    'Secretary',
    'Chairperson',
    'Vice Chairperson',
    'Board Member',
    'Administrator',
    'Other',
  ];

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
    return { label: 'Strong', color: COLORS.primary };
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
        if (name.trim().length < 3) {
          Alert.alert('Error', 'Organization name must be at least 3 characters');
          return false;
        }
        if (description.trim().length < 50) {
          Alert.alert('Error', 'Description must be at least 50 characters');
          return false;
        }
        return true;

      case 3:
        if (focusAreas.length === 0) {
          Alert.alert('Error', 'Please select at least one focus area');
          return false;
        }
        if (!city.trim()) {
          Alert.alert('Error', 'Please enter your city');
          return false;
        }
        return true;

      case 4:
        if (!userName.trim()) {
          Alert.alert('Error', 'Please enter your full name');
          return false;
        }
        if (!userTitle) {
          Alert.alert('Error', 'Please select your title/position');
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

  const toggleFocusArea = (area) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter((a) => a !== area));
    } else {
      if (focusAreas.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 focus areas');
        return;
      }
      setFocusAreas([...focusAreas, area]);
    }
  };

  const removeFocusArea = (area) => {
    setFocusAreas(focusAreas.filter((a) => a !== area));
  };

  const filteredFocusAreas = allFocusAreas.filter((area) =>
    area.toLowerCase().includes(focusSearchQuery.toLowerCase())
  );

  const filteredBodyTypes = bodyTypes.filter((type) =>
    type.label.toLowerCase().includes(bodyTypeSearchQuery.toLowerCase())
  );

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const filteredPositions = positionOptions.filter((pos) =>
    pos.toLowerCase().includes(positionSearchQuery.toLowerCase())
  );

  const getBodyTypeLabel = () => {
    const type = bodyTypes.find((t) => t.value === bodyType);
    return type ? type.label : 'Select organization type';
  };

  // ✅ DIRECT TO BODY DASHBOARD - NO LOGOUT
  const handleSubmit = async () => {
  if (!validateStep(4)) return;

  Alert.alert(
    'Register Organization',
    'Create account and submit organization for verification?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          setSubmitting(true);
          
          // Store email for the success message
          const userEmail = email.trim().toLowerCase();
          
          try {
            console.log('🔵 Starting Body Registration...');

            // Step 1: Create Supabase Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: userEmail,
              password: password,
              options: {
                data: {
                  user_type: 'body',
                  organization_name: name.trim(),
                },
              },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user account');

            const userId = authData.user.id;

            console.log('✅ Auth user created:', userId);

            // ✅ CRITICAL: Sign out IMMEDIATELY
            console.log('🔄 Signing out immediately...');
            await supabase.auth.signOut();
            
            // Wait a moment for sign out to process
            await new Promise(resolve => setTimeout(resolve, 100));

            // Step 2: Create Body Profile
            console.log('📝 Creating body profile in database...');
            
            const { error: bodyError } = await supabase
              .from('bodies')
              .insert({
                id: userId,
                name: name.trim(),
                body_type: bodyType,
                description: description.trim(),
                email: userEmail,
                phone: phone.trim() || null,
                address: address.trim() || null,
                city: city.trim(),
                country: country,
                registration_number: registrationNumber.trim() || null,
                focus_areas: focusAreas,
                admin_title: userTitle,
                admin_name: userName.trim(),
                verification_status: 'pending',
              });

            if (bodyError) {
              console.error('❌ Body insert error:', bodyError);
              throw new Error(`Failed to create body profile: ${bodyError.message}`);
            }

            console.log('✅ Body profile created successfully!');

          } catch (error) {
            console.error('❌ Registration error:', error);
            setSubmitting(false);
            Alert.alert(
              'Registration Error',
              error.message || 'Failed to register organization. Please try again.'
            );
            return; // Exit early on error
          }

          // ✅ Success - Navigate back to root
          setSubmitting(false);
          
          // Show success message WITHOUT navigation
          Alert.alert(
            'Success! 🎉',
            `Organization account created successfully!\n\nEmail: ${userEmail}\n\nPlease log in to continue.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Go back to the root/onboarding screen
                  // The user is signed out, so they'll see the auth screens
                  navigation.navigate('Onboarding');
                },
              },
            ]
          );
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
      { number: 2, title: 'Organization Info', subtitle: 'Tell us about your organization' },
      { number: 3, title: 'Focus & Location', subtitle: 'Where do you work?' },
      { number: 4, title: 'Verification', subtitle: 'Confirm your identity' },
    ];

    return (
      <View style={styles.stepIndicatorContainer}>
        <Text style={styles.stepTitle}>{steps[currentStep - 1].title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep - 1].subtitle}</Text>
      </View>
    );
  };

  // Focus Area Modal
  const renderFocusAreaModal = () => (
    <Modal
      visible={showFocusModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFocusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Focus Areas</Text>
            <TouchableOpacity onPress={() => setShowFocusModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search focus areas..."
            placeholderTextColor={COLORS.mediumGray}
            value={focusSearchQuery}
            onChangeText={setFocusSearchQuery}
          />

          <Text style={styles.modalSubtitle}>{focusAreas.length}/5 selected</Text>

          <FlatList
            data={filteredFocusAreas}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = focusAreas.includes(item);
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => toggleFocusArea(item)}
                >
                  <Text
                    style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}
                  >
                    {item}
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
            onPress={() => setShowFocusModal(false)}
          >
            <Text style={styles.modalDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Body Type Modal
  const renderBodyTypeModal = () => (
    <Modal
      visible={showBodyTypeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowBodyTypeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Organization Type</Text>
            <TouchableOpacity onPress={() => setShowBodyTypeModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search organization types..."
            placeholderTextColor={COLORS.mediumGray}
            value={bodyTypeSearchQuery}
            onChangeText={setBodyTypeSearchQuery}
          />

          <FlatList
            data={filteredBodyTypes}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = bodyType === item.value;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setBodyType(item.value);
                    setShowBodyTypeModal(false);
                    setBodyTypeSearchQuery('');
                  }}
                >
                  <View style={styles.modalItemWithIcon}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={isSelected ? COLORS.primary : COLORS.mediumGray}
                    />
                    <Text
                      style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  // Country Modal
  const renderCountryModal = () => (
    <Modal
      visible={showCountryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCountryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            placeholderTextColor={COLORS.mediumGray}
            value={countrySearchQuery}
            onChangeText={setCountrySearchQuery}
          />

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = country === item;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setCountry(item);
                    setShowCountryModal(false);
                    setCountrySearchQuery('');
                  }}
                >
                  <Text
                    style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  // Position Modal
  const renderPositionModal = () => (
    <Modal
      visible={showPositionModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPositionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Title/Position</Text>
            <TouchableOpacity onPress={() => setShowPositionModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search positions..."
            placeholderTextColor={COLORS.mediumGray}
            value={positionSearchQuery}
            onChangeText={setPositionSearchQuery}
          />

          <FlatList
            data={filteredPositions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = userTitle === item;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setUserTitle(item);
                    setShowPositionModal(false);
                    setPositionSearchQuery('');
                  }}
                >
                  <Text
                    style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
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
          placeholder="official@organization.org"
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
        <Text style={styles.infoText}>
          Use your official organization email for verification
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Organization Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Ministry of Education"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={200}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Organization Type *</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowBodyTypeModal(true)}>
          <Text style={styles.dropdownButtonText}>{getBodyTypeLabel()}</Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Registration Number</Text>
        <TextInput
          style={styles.input}
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          placeholder="Official registration/license number (optional)"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your organization's purpose and activities..."
          placeholderTextColor={COLORS.mediumGray}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Focus Areas * (Select up to 5)</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowFocusModal(true)}>
          <Text style={styles.dropdownButtonText}>
            {focusAreas.length === 0 ? 'Select focus areas' : `${focusAreas.length} selected`}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        {focusAreas.length > 0 && (
          <View style={styles.selectedAreasContainer}>
            {focusAreas.map((area) => (
              <View key={area} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{area}</Text>
                <TouchableOpacity onPress={() => removeFocusArea(area)}>
                  <Ionicons name="close-circle" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="e.g., Nairobi"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Country *</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowCountryModal(true)}>
          <Text style={styles.dropdownButtonText}>{country}</Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Physical Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street address or P.O. Box"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={300}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.formContainer}>
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>
          We need to verify that you have authority to register this organization
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Full Name *</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
          placeholder="e.g., John Doe"
          placeholderTextColor={COLORS.mediumGray}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+254 XXX XXX XXX"
          placeholderTextColor={COLORS.mediumGray}
          keyboardType="phone-pad"
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Title/Position *</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowPositionModal(true)}>
          <Text style={styles.dropdownButtonText}>{userTitle || 'Select your position'}</Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Your position in the organization helps us verify your authority
        </Text>
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
          <Text style={styles.headerTitle}>Register Organization</Text>
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
      {renderFocusAreaModal()}
      {renderBodyTypeModal()}
      {renderCountryModal()}
      {renderPositionModal()}
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
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.mediumGray,
    textAlign: 'right',
    marginTop: 4,
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
  helperText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    marginTop: 4,
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
  modalItemWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

export default RegisterBodyScreen;
