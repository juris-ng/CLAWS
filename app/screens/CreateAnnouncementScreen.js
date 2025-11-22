// screens/body/CreateAnnouncementScreen.js
import { Ionicons } from '@expo/vector-icons';
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
  warning: '#FF9800',
};

const CreateAnnouncementScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    isPinned: false,
    visibility: 'public',
  });

  const priorityOptions = [
    { id: 'low', label: 'Low', icon: 'arrow-down-circle-outline', color: COLORS.mediumGray },
    { id: 'normal', label: 'Normal', icon: 'remove-circle-outline', color: COLORS.primary },
    { id: 'high', label: 'High', icon: 'arrow-up-circle-outline', color: COLORS.warning },
    { id: 'urgent', label: 'Urgent', icon: 'alert-circle-outline', color: COLORS.error },
  ];

  const visibilityOptions = [
    { id: 'public', label: 'Public', icon: 'globe-outline' },
    { id: 'followers', label: 'Followers', icon: 'people-outline' },
    { id: 'private', label: 'Private', icon: 'lock-closed-outline' },
  ];

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter announcement title');
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert('Error', 'Please enter announcement content');
      return;
    }

    setLoading(true);

    try {
      const contentData = {
        content_type: 'announcement',
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        category: formData.priority,
      };

      const result = await BodyContentService.createContent(contentData);

      if (result.success) {
        Alert.alert('Success', 'Announcement created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
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
          <Text style={styles.headerTitle}>Create Announcement</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Important Community Update"
              placeholderTextColor={COLORS.mediumGray}
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Content <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your announcement here..."
              placeholderTextColor={COLORS.mediumGray}
              value={formData.content}
              onChangeText={(text) => updateFormData('content', text)}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.priorityChip,
                    formData.priority === option.id && {
                      borderColor: option.color,
                      backgroundColor: option.color + '15',
                    },
                  ]}
                  onPress={() => updateFormData('priority', option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={formData.priority === option.id ? option.color : COLORS.mediumGray}
                  />
                  <Text
                    style={[
                      styles.priorityLabel,
                      formData.priority === option.id && { color: option.color, fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Options</Text>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="pin-outline" size={20} color={COLORS.darkGray} />
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>Pin Announcement</Text>
                  <Text style={styles.switchDescription}>Keep at top of announcements</Text>
                </View>
              </View>
              <Switch
                value={formData.isPinned}
                onValueChange={(value) => updateFormData('isPinned', value)}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '40' }}
                thumbColor={formData.isPinned ? COLORS.primary : COLORS.white}
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
                    color={formData.visibility === option.id ? COLORS.primary : COLORS.mediumGray}
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
                <Ionicons name="megaphone" size={20} color={COLORS.white} />
                <Text style={styles.createButtonText}>Create Announcement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    height: 150,
    paddingTop: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    minWidth: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 4,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
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
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  visibilityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  visibilityLabelActive: {
    color: COLORS.primary,
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
    backgroundColor: COLORS.primary,
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

export default CreateAnnouncementScreen;
