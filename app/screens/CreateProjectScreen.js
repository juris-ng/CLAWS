// screens/body/CreateProjectScreen.js
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BodyContentService } from '../../utils/bodyContentService';

const COLORS = {
  primary: '#0047AB',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  background: '#F8F9FA',
  success: '#4CAF50',
  error: '#F44336',
  info: '#2196F3',
};

const CreateProjectScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({ visible: false, field: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    budget: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    acceptsVolunteers: false,
    visibility: 'public',
  });

  const categoryOptions = [
    { id: 'infrastructure', label: 'Infrastructure', icon: 'construct-outline', color: '#FF6B6B' },
    { id: 'education', label: 'Education', icon: 'school-outline', color: '#4ECDC4' },
    { id: 'healthcare', label: 'Healthcare', icon: 'medical-outline', color: '#95E1D3' },
    { id: 'environment', label: 'Environment', icon: 'leaf-outline', color: '#45B7D1' },
    { id: 'community', label: 'Community', icon: 'people-outline', color: '#F38181' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: COLORS.mediumGray },
  ];

  const visibilityOptions = [
    { id: 'public', label: 'Public', icon: 'globe-outline' },
    { id: 'followers', label: 'Followers', icon: 'people-outline' },
    { id: 'private', label: 'Private', icon: 'lock-closed-outline' },
  ];

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      updateFormData(showDatePicker.field, selectedDate);
    }
    setShowDatePicker({ visible: false, field: null });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter project title');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter project description');
      return;
    }

    if (formData.endDate <= formData.startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const contentData = {
        content_type: 'project',
        title: formData.title.trim(),
        content: formData.description.trim(),
        category: formData.category,
        start_date: formData.startDate.toISOString(),
        end_date: formData.endDate.toISOString(),
      };

      const result = await BodyContentService.createContent(contentData);

      if (result.success) {
        Alert.alert('Success', 'Project created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Project</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>
              Project Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Community Center Construction"
              placeholderTextColor={COLORS.mediumGray}
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the project goals, scope, and expected outcomes..."
              placeholderTextColor={COLORS.mediumGray}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.categoryCard,
                    formData.category === option.id && {
                      borderColor: option.color,
                      backgroundColor: option.color + '15',
                    },
                  ]}
                  onPress={() => updateFormData('category', option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={formData.category === option.id ? option.color : COLORS.mediumGray}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      formData.category === option.id && { color: option.color, fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Budget (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter estimated budget"
              placeholderTextColor={COLORS.mediumGray}
              value={formData.budget}
              onChangeText={(text) => updateFormData('budget', text)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Project Timeline</Text>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.subLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker({ visible: true, field: 'startDate' })}
                >
                  <Ionicons name="calendar-outline" size={20} color={COLORS.info} />
                  <Text style={styles.dateText}>{formatDate(formData.startDate)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.subLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker({ visible: true, field: 'endDate' })}
                >
                  <Ionicons name="calendar-outline" size={20} color={COLORS.info} />
                  <Text style={styles.dateText}>{formatDate(formData.endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Options</Text>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="hand-right-outline" size={20} color={COLORS.darkGray} />
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>Accept Volunteers</Text>
                  <Text style={styles.switchDescription}>Allow community members to volunteer</Text>
                </View>
              </View>
              <Switch
                value={formData.acceptsVolunteers}
                onValueChange={(value) => updateFormData('acceptsVolunteers', value)}
                trackColor={{ false: COLORS.lightGray, true: COLORS.info + '40' }}
                thumbColor={formData.acceptsVolunteers ? COLORS.info : COLORS.white}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.visibilityRow}>
              {visibilityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.visibilityChip,
                    formData.visibility === option.id && styles.visibilityChipActive,
                  ]}
                  onPress={() => updateFormData('visibility', option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={formData.visibility === option.id ? COLORS.info : COLORS.mediumGray}
                  />
                  <Text
                    style={[
                      styles.visibilityLabel,
                      formData.visibility === option.id && styles.visibilityLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="briefcase" size={20} color={COLORS.white} />
                <Text style={styles.createButtonText}>Create Project</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {showDatePicker.visible && (
          <DateTimePicker
            value={formData[showDatePicker.field]}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={showDatePicker.field === 'startDate' ? new Date() : formData.startDate}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginBottom: 6,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.darkGray,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.darkGray,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 14,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  switchDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  visibilityChipActive: {
    borderColor: COLORS.info,
    backgroundColor: COLORS.info + '10',
  },
  visibilityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  visibilityLabelActive: {
    color: COLORS.info,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.info,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateProjectScreen;
