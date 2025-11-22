// screens/body/CreateDiscussionScreen.js
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
  teal: '#009688',
};

const CreateDiscussionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'followers',
    allowAnonymous: false,
  });

  const visibilityOptions = [
    {
      id: 'public',
      label: 'Public Discussion',
      icon: 'globe-outline',
      description: 'Anyone can view and participate',
    },
    {
      id: 'followers',
      label: 'Followers Only',
      icon: 'people-outline',
      description: 'Only body followers can participate',
    },
    {
      id: 'private',
      label: 'Internal',
      icon: 'lock-closed-outline',
      description: 'Private discussion for team members',
    },
  ];

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter discussion topic');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter discussion description');
      return;
    }

    setLoading(true);

    try {
      const contentData = {
        content_type: 'discussion',
        title: formData.title.trim(),
        content: formData.description.trim(),
      };

      const result = await BodyContentService.createContent(contentData);

      if (result.success) {
        Alert.alert(
          'Success',
          'Discussion created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create discussion');
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
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
          <Text style={styles.headerTitle}>Start Discussion</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>
              Discussion Topic <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Budget Allocation for 2025"
              placeholderTextColor={COLORS.mediumGray}
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              maxLength={150}
            />
            <Text style={styles.charCount}>{formData.title.length}/150</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Description & Context <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide context and questions to guide the discussion. What would you like to discuss with your community?"
              placeholderTextColor={COLORS.mediumGray}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{formData.description.length}/2000</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.teal} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Discussion Guidelines</Text>
              <Text style={styles.infoText}>
                • Keep conversations respectful and constructive{'\n'}
                • Stay on topic and focus on the discussion{'\n'}
                • Provide evidence and sources when making claims{'\n'}
                • Listen to different viewpoints
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Who Can Participate</Text>
            {visibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.visibilityOption,
                  formData.visibility === option.id && styles.visibilityOptionActive,
                ]}
                onPress={() => updateFormData('visibility', option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.visibilityLeft}>
                  <View
                    style={[
                      styles.visibilityIcon,
                      formData.visibility === option.id && styles.visibilityIconActive,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={formData.visibility === option.id ? COLORS.teal : COLORS.mediumGray}
                    />
                  </View>
                  <View style={styles.visibilityTextContainer}>
                    <Text
                      style={[
                        styles.visibilityLabel,
                        formData.visibility === option.id && styles.visibilityLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.visibilityDescription}>{option.description}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radio,
                    formData.visibility === option.id && styles.radioActive,
                  ]}
                >
                  {formData.visibility === option.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Privacy Options</Text>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="eye-off-outline" size={20} color={COLORS.darkGray} />
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>Allow Anonymous Comments</Text>
                  <Text style={styles.switchDescription}>
                    Let participants comment without revealing their identity
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.allowAnonymous}
                onValueChange={(value) => updateFormData('allowAnonymous', value)}
                trackColor={{ false: COLORS.lightGray, true: COLORS.teal + '40' }}
                thumbColor={formData.allowAnonymous ? COLORS.teal : COLORS.white}
              />
            </View>

            {formData.allowAnonymous && (
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={16} color={COLORS.error} />
                <Text style={styles.warningText}>
                  Anonymous comments may reduce accountability. Moderate discussions carefully.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.previewBadge}>
                  <Ionicons name="chatbubbles-outline" size={16} color={COLORS.teal} />
                  <Text style={styles.previewBadgeText}>DISCUSSION</Text>
                </View>
                <View style={styles.previewStatusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.previewStatusText}>Open</Text>
                </View>
              </View>

              <Text style={styles.previewTitle}>
                {formData.title || 'Discussion topic will appear here'}
              </Text>
              <Text style={styles.previewDescription}>
                {formData.description || 'Discussion description will appear here...'}
              </Text>

              <View style={styles.previewFooter}>
                <View style={styles.previewInfo}>
                  <Ionicons
                    name={
                      formData.visibility === 'public'
                        ? 'globe-outline'
                        : formData.visibility === 'followers'
                        ? 'people-outline'
                        : 'lock-closed-outline'
                    }
                    size={14}
                    color={COLORS.mediumGray}
                  />
                  <Text style={styles.previewInfoText}>
                    {formData.visibility === 'public'
                      ? 'Public'
                      : formData.visibility === 'followers'
                      ? 'Followers'
                      : 'Internal'}
                  </Text>
                </View>

                {formData.allowAnonymous && (
                  <View style={styles.previewInfo}>
                    <Ionicons name="eye-off-outline" size={14} color={COLORS.mediumGray} />
                    <Text style={styles.previewInfoText}>Anonymous allowed</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 Tips for Effective Discussions</Text>
            <Text style={styles.tipsText}>
              • Ask clear, specific questions{'\n'}
              • Provide necessary background information{'\n'}
              • Set expectations for the discussion{'\n'}
              • Be responsive to participant comments{'\n'}
              • Summarize key points and conclusions
            </Text>
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
                <Ionicons name="chatbubbles" size={20} color={COLORS.white} />
                <Text style={styles.createButtonText}>Start Discussion</Text>
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
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.teal + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.teal,
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  visibilityOptionActive: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.teal + '08',
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  visibilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityIconActive: {
    backgroundColor: COLORS.teal + '20',
  },
  visibilityTextContainer: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  visibilityLabelActive: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  visibilityDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.teal,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.teal,
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.error,
    lineHeight: 18,
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.teal,
  },
  previewStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  previewStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 16,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewInfoText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  tipsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    lineHeight: 22,
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
    backgroundColor: COLORS.teal,
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

export default CreateDiscussionScreen;
