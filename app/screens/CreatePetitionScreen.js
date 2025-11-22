// screens/petition/CreatePetitionScreen.js
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
import { supabase } from '../../supabase';
import { GeminiAIService } from '../../utils/geminiAIService';
import { getCategoryInfo, getRandomCategoryImage } from '../../utils/petitionCategoriesService';
import { PetitionService } from '../../utils/petitionService';

const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

const CreatePetitionScreen = ({ navigation }) => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousReason, setAnonymousReason] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('education');
  const [targetAudience, setTargetAudience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userIsAnonymous, setUserIsAnonymous] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  // ✅ NEW: Title suggestions modal state
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState([]);

  // Image states
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [useAutoImage, setUseAutoImage] = useState(true);

  useEffect(() => {
    checkUserAnonymousStatus();
    updateAutoImage('education');
  }, []);

  useEffect(() => {
    if (useAutoImage) {
      updateAutoImage(category);
    }
  }, [category, useAutoImage]);

  const checkUserAnonymousStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('members')
        .select('is_anonymous')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserIsAnonymous(data.is_anonymous);
        setIsAnonymous(data.is_anonymous);
      }
    } catch (error) {
      console.error('Error checking anonymous status:', error);
    }
  };

  const updateAutoImage = (selectedCategory) => {
    const autoImage = getRandomCategoryImage(selectedCategory);
    setPreviewImage(autoImage);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        setPreviewImage(uri);
        setUseAutoImage(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRegenerateImage = () => {
    if (useAutoImage) {
      updateAutoImage(category);
    }
  };

  // AI Functions
  const handleImproveWithAI = async () => {
    if (!description || description.trim().length < 20) {
      Alert.alert('Error', 'Write a description first (at least 20 characters)');
      return;
    }

    setAiProcessing(true);
    try {
      const result = await GeminiAIService.improvePetition(description);
      
      if (result.success) {
        Alert.alert(
          '✨ AI Improved Version',
          result.improvedText,
          [
            { text: 'Keep Original', style: 'cancel' },
            { 
              text: 'Use AI Version', 
              onPress: () => setDescription(result.improvedText)
            }
          ]
        );
      } else {
        Alert.alert('Error', 'AI service is temporarily unavailable. Please try again.');
      }
    } catch (error) {
      console.error('AI improvement error:', error);
      Alert.alert('Error', 'Failed to improve petition with AI');
    } finally {
      setAiProcessing(false);
    }
  };

  // ✅ UPDATED: Better title suggestions with modal
  const handleSuggestTitles = async () => {
    if (!description || description.trim().length < 20) {
      Alert.alert('Error', 'Write a description first (at least 20 characters)');
      return;
    }

    setAiProcessing(true);
    try {
      const result = await GeminiAIService.suggestTitles(description);
      
      if (result.success) {
        // Parse the titles (assuming they come numbered 1., 2., 3.)
        const titlesArray = result.titles
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(title => title.length > 0)
          .slice(0, 3);

        setTitleSuggestions(titlesArray);
        setShowTitleModal(true);
      } else {
        Alert.alert('Error', 'AI service is temporarily unavailable. Please try again.');
      }
    } catch (error) {
      console.error('AI title suggestion error:', error);
      Alert.alert('Error', 'Failed to generate title suggestions');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleCheckTone = async () => {
    if (!description || description.trim().length < 20) {
      Alert.alert('Error', 'Write a description first (at least 20 characters)');
      return;
    }

    setAiProcessing(true);
    try {
      const result = await GeminiAIService.analyzeSentiment(description);
      
      if (result.success) {
        const sentimentEmoji = {
          positive: '😊',
          neutral: '😐',
          negative: '😟'
        };

        const toneAdvice = {
          positive: 'Your petition has a positive, constructive tone. This is great for encouraging support!',
          neutral: 'Your petition has a neutral tone. Consider adding more emotion to connect with readers.',
          negative: 'Your petition has a negative tone. Consider reframing to be more solutions-focused.'
        };

        Alert.alert(
          `${sentimentEmoji[result.sentiment] || '📊'} Sentiment Analysis`,
          `Tone: ${result.sentiment.toUpperCase()}\n\n${toneAdvice[result.sentiment] || 'Your tone analysis is complete.'}`
        );
      } else {
        Alert.alert('Error', 'AI service is temporarily unavailable. Please try again.');
      }
    } catch (error) {
      console.error('AI sentiment analysis error:', error);
      Alert.alert('Error', 'Failed to analyze sentiment');
    } finally {
      setAiProcessing(false);
    }
  };

  const validateForm = () => {
    if (title.trim().length < 10) {
      Alert.alert('Error', 'Title must be at least 10 characters');
      return false;
    }
    if (description.trim().length < 50) {
      Alert.alert('Error', 'Description must be at least 50 characters');
      return false;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (isAnonymous && anonymousReason.trim().length < 20) {
      Alert.alert('Error', 'Please provide a reason for anonymous petition (min 20 characters)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const anonymityMessage = isAnonymous
      ? 'Your identity will be protected in this petition.'
      : 'Your name will be visible as the petition creator.';

    Alert.alert(
      'Submit Petition',
      `${anonymityMessage}\n\nYour petition will be reviewed before publication. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const petitionData = {
                title: title.trim(),
                description: description.trim(),
                category,
                targetAudience: targetAudience.trim() || null,
                isAnonymous,
                anonymousReason: isAnonymous ? anonymousReason.trim() : null,
                imageUrl: selectedImage || (useAutoImage ? previewImage : null),
              };

              const result = await PetitionService.createPetition(petitionData);

              if (result.success) {
                Alert.alert('Success', 'Your petition has been submitted for review.', [
                  {
                    text: 'OK',
                    onPress: () => {
                      setTitle('');
                      setDescription('');
                      setTargetAudience('');
                      setAnonymousReason('');
                      setSelectedImage(null);
                      setPreviewImage(null);
                      setUseAutoImage(true);
                      navigation.navigate('Home');
                    },
                  },
                ]);
              } else {
                Alert.alert('Error', result.error || 'Failed to submit petition');
              }
            } catch (error) {
              console.error('Error submitting petition:', error);
              Alert.alert('Error', 'Failed to submit petition');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const categoryInfo = getCategoryInfo(category);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* CLEAN WHITE HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Create Petition</Text>
          <Text style={styles.headerSubtitle}>Make your voice heard</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="image-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Petition Image</Text>
          </View>

          <View style={styles.imagePreviewContainer}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="images-outline" size={48} color={COLORS.lightGray} />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}

            {useAutoImage && previewImage && (
              <View style={styles.autoImageBadge}>
                <Ionicons name="sparkles" size={12} color={COLORS.warning} />
                <Text style={styles.autoImageBadgeText}>Auto</Text>
              </View>
            )}
          </View>

          <View style={styles.imageButtonsRow}>
            <TouchableOpacity
              style={[styles.imageButton, useAutoImage && styles.imageButtonActive]}
              onPress={() => {
                setUseAutoImage(true);
                setSelectedImage(null);
                updateAutoImage(category);
              }}
            >
              <Ionicons name="sparkles" size={18} color={useAutoImage ? COLORS.white : COLORS.primary} />
              <Text style={[styles.imageButtonText, useAutoImage && styles.imageButtonTextActive]}>
                Auto Image
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.imageButton, !useAutoImage && styles.imageButtonActive]} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={18} color={!useAutoImage ? COLORS.white : COLORS.primary} />
              <Text style={[styles.imageButtonText, !useAutoImage && styles.imageButtonTextActive]}>
                Upload
              </Text>
            </TouchableOpacity>

            {useAutoImage && (
              <TouchableOpacity style={styles.refreshButton} onPress={handleRegenerateImage}>
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.card}>
          <View style={styles.anonymousHeader}>
            <View style={styles.anonymousHeaderLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={isAnonymous ? COLORS.success : COLORS.mediumGray} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Anonymous Petition</Text>
                <Text style={styles.cardSubtitle}>
                  {isAnonymous ? 'Identity protected' : 'Name will be visible'}
                </Text>
              </View>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          {isAnonymous && (
            <View style={styles.anonymousInfo}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.success} />
                <Text style={styles.infoText}>
                  Anonymous petitions protect activists from potential retaliation
                </Text>
              </View>
              <TextInput
                style={styles.textArea}
                value={anonymousReason}
                onChangeText={setAnonymousReason}
                placeholder="Why should this petition be anonymous? (Required for review)"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{anonymousReason.length}/500</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Petition Title *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Improve Student Library Access"
            placeholderTextColor={COLORS.mediumGray}
            maxLength={200}
          />
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>

        {/* Category */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="folder-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Category *</Text>
          </View>

          <View style={styles.pickerWrapper}>
            <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
              <Picker.Item label="🎓 Education" value="education" />
              <Picker.Item label="🏥 Healthcare" value="health" />
              <Picker.Item label="🌱 Environment" value="environment" />
              <Picker.Item label="⚖️ Human Rights" value="justice" />
              <Picker.Item label="🏗️ Infrastructure" value="infrastructure" />
              <Picker.Item label="🏛️ Governance" value="governance" />
              <Picker.Item label="👥 Social Issues" value="economy" />
              <Picker.Item label="📋 Other" value="other" />
            </Picker>
          </View>

          {categoryInfo && (
            <View style={[styles.categoryBadge, { borderLeftColor: categoryInfo.color }]}>
              <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{categoryInfo.name}</Text>
                <Text style={styles.categoryHint}>{categoryInfo.images?.length || 3}+ auto-images available</Text>
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="reader-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Description *</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue and what changes you're proposing..."
            placeholderTextColor={COLORS.mediumGray}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{description.length}/2000</Text>

          {/* AI ACTIONS ROW */}
          <View style={styles.aiActionsRow}>
            <TouchableOpacity 
              style={[styles.aiButton, aiProcessing && styles.aiButtonDisabled]}
              onPress={handleImproveWithAI}
              disabled={aiProcessing || !description}
              activeOpacity={0.7}
            >
              {aiProcessing ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="sparkles" size={18} color={COLORS.warning} />
              )}
              <Text style={styles.aiButtonText}>Improve</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.aiButton, aiProcessing && styles.aiButtonDisabled]}
              onPress={handleSuggestTitles}
              disabled={aiProcessing || !description}
              activeOpacity={0.7}
            >
              {aiProcessing ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
              )}
              <Text style={styles.aiButtonText}>Titles</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.aiButton, aiProcessing && styles.aiButtonDisabled]}
              onPress={handleCheckTone}
              disabled={aiProcessing || !description}
              activeOpacity={0.7}
            >
              {aiProcessing ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="analytics-outline" size={18} color={COLORS.success} />
              )}
              <Text style={styles.aiButtonText}>Tone</Text>
            </TouchableOpacity>
          </View>

          {/* AI Info Badge */}
          <View style={styles.aiInfoBadge}>
            <Ionicons name="sparkles" size={14} color={COLORS.warning} />
            <Text style={styles.aiInfoText}>FREE AI-powered assistance • Powered by Google Gemini</Text>
          </View>
        </View>

        {/* Target Audience */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Target Audience</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          </View>
          <TextInput
            style={styles.input}
            value={targetAudience}
            onChangeText={setTargetAudience}
            placeholder="Who should address this? (e.g., University Administration)"
            placeholderTextColor={COLORS.mediumGray}
            maxLength={200}
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
          <Text style={styles.tipsText}>
            Clear, specific petitions with detailed explanations are more likely to gain support and be approved quickly
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (submitting || aiProcessing) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || aiProcessing}
          activeOpacity={0.8}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </>
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Submit Petition</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>

      {/* ✅ NEW: Title Suggestions Modal */}
      <Modal
        visible={showTitleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTitleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="bulb" size={24} color={COLORS.warning} />
                <Text style={styles.modalTitle}>AI Title Suggestions</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTitleModal(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Tap a title to use it</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {titleSuggestions.map((suggestedTitle, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.titleOption}
                  onPress={() => {
                    setTitle(suggestedTitle);
                    setShowTitleModal(false);
                    Alert.alert('✅ Title Added', 'The suggested title has been added!');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.titleOptionNumber}>
                    <Text style={styles.titleOptionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.titleOptionText}>{suggestedTitle}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTitleModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  helpButton: {
    padding: 4,
  },

  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },

  // Image
  imagePreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.veryLightGray,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  autoImageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoImageBadgeText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 6,
  },
  imageButtonActive: {
    backgroundColor: COLORS.primary,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  imageButtonTextActive: {
    color: COLORS.white,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Anonymous
  anonymousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  anonymousHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  anonymousInfo: {
    marginTop: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.success,
    flex: 1,
    lineHeight: 18,
  },

  // Form
  input: {
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.darkGray,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'right',
    marginTop: 6,
  },
  optionalBadge: {
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionalText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },

  // AI Actions
  aiActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  aiButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    gap: 6,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  aiButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  aiInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 8,
    gap: 6,
  },
  aiInfoText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '600',
  },

  // Picker
  pickerWrapper: {
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: 'hidden',
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    gap: 12,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  categoryHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },

  // Tips
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  tipsText: {
    fontSize: 13,
    color: COLORS.warning,
    flex: 1,
    lineHeight: 18,
  },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.mediumGray,
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    height: 40,
  },

  // ✅ NEW: Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  titleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  titleOptionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleOptionNumberText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  titleOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  modalCloseButton: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
});

export default CreatePetitionScreen;
