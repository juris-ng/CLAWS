import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { ConsultationService } from '../../utils/consultationService';
import { LawyerService } from '../../utils/lawyerService';

const BookConsultationScreen = ({ route, navigation }) => {
  const { lawyerId } = route.params;

  const [lawyer, setLawyer] = useState(null);
  const [userId, setUserId] = useState(null);
  const [bookingType, setBookingType] = useState('initial');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [meetingMode, setMeetingMode] = useState('video');
  const [location, setLocation] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadLawyer();
  }, [lawyerId]);

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

  const loadLawyer = async () => {
    try {
      const result = await LawyerService.getLawyerById(lawyerId);
      if (result.success) {
        setLawyer(result.lawyer);
      } else {
        Alert.alert('Error', 'Failed to load lawyer information');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading lawyer:', error);
      Alert.alert('Error', 'Failed to load lawyer information');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const validateForm = () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to book a consultation');
      return false;
    }

    const now = new Date();
    const consultationDateTime = new Date(selectedDate);
    consultationDateTime.setHours(selectedTime.getHours());
    consultationDateTime.setMinutes(selectedTime.getMinutes());

    if (consultationDateTime < now) {
      Alert.alert('Error', 'Please select a future date and time');
      return false;
    }

    if (meetingMode === 'in_person' && !location.trim()) {
      Alert.alert('Error', 'Please provide a meeting location for in-person consultations');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const consultationDateTime = new Date(selectedDate);
      consultationDateTime.setHours(selectedTime.getHours());
      consultationDateTime.setMinutes(selectedTime.getMinutes());

      const bookingData = {
        lawyer_id: lawyerId,
        client_id: userId,
        consultation_type: bookingType,
        consultation_date: consultationDateTime.toISOString(),
        duration_minutes: parseInt(duration),
        meeting_mode: meetingMode,
        location: location.trim() || null,
        client_notes: clientNotes.trim() || null,
        fee_amount: lawyer?.consultation_fee || 0,
        status: 'pending',
      };

      const result = await ConsultationService.bookConsultation(bookingData);

      if (result.success) {
        Alert.alert(
          'Success! 🎉',
          `Your consultation has been booked for ${formatDate(
            consultationDateTime
          )} at ${formatTime(consultationDateTime)}. The lawyer will confirm shortly.`,
          [
            {
              text: 'View My Consultations',
              onPress: () => navigation.replace('MyConsultations'),
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to book consultation');
      }
    } catch (error) {
      console.error('Error booking consultation:', error);
      Alert.alert('Error', 'Failed to book consultation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading lawyer information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lawyer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyIcon}>⚖️</Text>
          <Text style={styles.emptyText}>Lawyer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Book Consultation</Text>
              <Text style={styles.subtitle}>with {lawyer.full_name}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* Lawyer Info Card */}
            <View style={styles.lawyerCard}>
              <View style={styles.lawyerHeader}>
                <View style={styles.lawyerAvatar}>
                  <Text style={styles.lawyerAvatarText}>
                    {lawyer.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.lawyerInfo}>
                  <Text style={styles.lawyerName}>{lawyer.full_name}</Text>
                  {lawyer.law_firm && <Text style={styles.lawyerFirm}>{lawyer.law_firm}</Text>}
                  {lawyer.rating && (
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingIcon}>⭐</Text>
                      <Text style={styles.ratingText}>{lawyer.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>
              {lawyer.consultation_fee && (
                <View style={styles.feeContainer}>
                  <Text style={styles.feeLabel}>Consultation Fee:</Text>
                  <Text style={styles.feeValue}>
                    KES {lawyer.consultation_fee.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Consultation Type */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Consultation Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={bookingType}
                  onValueChange={setBookingType}
                  style={styles.picker}
                >
                  <Picker.Item label="🆕 Initial Consultation" value="initial" />
                  <Picker.Item label="🔄 Follow-up Session" value="follow_up" />
                  <Picker.Item label="🚨 Urgent Consultation" value="urgent" />
                  <Picker.Item label="📋 Case Review" value="case_review" />
                  <Picker.Item label="💼 Contract Review" value="contract_review" />
                </Picker>
              </View>
            </View>

            {/* Meeting Mode */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Meeting Mode <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.modeButtons}>
                {[
                  { value: 'video', label: '📹 Video', icon: '📹' },
                  { value: 'phone', label: '📞 Phone', icon: '📞' },
                  { value: 'in_person', label: '🏢 In-Person', icon: '🏢' },
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.value}
                    style={[
                      styles.modeButton,
                      meetingMode === mode.value && styles.modeButtonActive,
                    ]}
                    onPress={() => setMeetingMode(mode.value)}
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        meetingMode === mode.value && styles.modeButtonTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeIcon}>📅</Text>
                <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Time <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeIcon}>🕐</Text>
                <Text style={styles.dateTimeText}>{formatTime(selectedTime)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}
            </View>

            {/* Duration */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Duration <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.durationButtons}>
                {['30', '60', '90', '120'].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationButton,
                      duration === mins && styles.durationButtonActive,
                    ]}
                    onPress={() => setDuration(mins)}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        duration === mins && styles.durationButtonTextActive,
                      ]}
                    >
                      {mins} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location (if in-person) */}
            {meetingMode === 'in_person' && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  Meeting Location <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter meeting address..."
                  placeholderTextColor="#999999"
                  multiline
                />
              </View>
            )}

            {/* Client Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={clientNotes}
                onChangeText={setClientNotes}
                placeholder="Any specific concerns or topics you'd like to discuss..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{clientNotes.length}/500</Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Booking Process</Text>
                <Text style={styles.infoText}>
                  • Your request will be sent to the lawyer{'\n'}
                  • The lawyer will review and confirm{'\n'}
                  • You'll receive a notification once confirmed{'\n'}
                  • Payment will be processed after confirmation
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
                {submitting ? 'Booking...' : '✓ Book Consultation'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
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
  lawyerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lawyerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  lawyerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lawyerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lawyerInfo: {
    flex: 1,
  },
  lawyerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  lawyerFirm: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  feeLabel: {
    fontSize: 14,
    color: '#666666',
  },
  feeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  durationButtonTextActive: {
    color: '#FFFFFF',
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 6,
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

export default BookConsultationScreen;
