import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { PointsService } from '../../utils/pointsService';
import { ProfileService } from '../../utils/profileService';
import { SearchService } from '../../utils/searchService';
import { UploadService } from '../../utils/uploadService';
import { validatePetitionForm } from '../../utils/validationSchemas';

export default function CreatePetitionScreen({ user, profile, onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [errors, setErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [characterCounts, setCharacterCounts] = useState({
    title: 0,
    description: 0,
  });

  useEffect(() => {
    loadCategories();
    loadDraft();
  }, []);

  const loadCategories = async () => {
    const cats = await SearchService.getCategories();
    setCategories(cats);
  };

  const loadDraft = async () => {
    // Load any existing draft
    const { data } = await supabase
      .from('petition_drafts')
      .select('*')
      .eq('member_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
      });
      setSelectedImage(data.image_url ? { uri: data.image_url } : null);
      setDraftId(data.id);
      setCharacterCounts({
        title: data.title?.length || 0,
        description: data.description?.length || 0,
      });
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        member_id: user.id,
        ...formData,
        image_url: selectedImage?.uri || null,
        updated_at: new Date().toISOString(),
      };

      if (draftId) {
        await supabase
          .from('petition_drafts')
          .update(draftData)
          .eq('id', draftId);
      } else {
        const { data } = await supabase
          .from('petition_drafts')
          .insert([draftData])
          .select()
          .single();
        setDraftId(data.id);
      }

      Alert.alert('Success', 'Draft saved successfully!');
    } catch (error) {
      console.error('Save draft error:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setCharacterCounts(prev => ({ ...prev, [field]: value.length }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImagePick = async (source) => {
    setShowImageOptions(false);
    let image;

    if (source === 'camera') {
      image = await UploadService.takePhoto();
    } else {
      image = await UploadService.pickImage();
    }

    if (image) {
      setSelectedImage(image);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setSelectedImage(null),
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validate form
    const validation = validatePetitionForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage && selectedImage.uri && !selectedImage.uri.startsWith('http')) {
        imageUrl = await UploadService.uploadFile(
          user.id,
          selectedImage.uri,
          selectedImage.fileName || 'petition-image.jpg'
        );
      } else if (selectedImage?.uri) {
        imageUrl = selectedImage.uri;
      }

      // Create petition
      const { data, error } = await supabase
        .from('petitions')
        .insert([{
          member_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          image_url: imageUrl,
          status: 'active',
        }])
        .select()
        .single();

      if (error) throw error;

      // Award points for creating petition
      await PointsService.awardPoints(user.id, 'member', 'petition_created', data.id);

      // Log activity
      await ProfileService.logActivity(user.id, 'petition_created', {
        petition_id: data.id,
        petition_title: formData.title,
        petition_category: formData.category,
        timestamp: new Date().toISOString(),
      });

      // Delete draft if exists
      if (draftId) {
        await supabase
          .from('petition_drafts')
          .delete()
          .eq('id', draftId);
      }

      Alert.alert(
        'Success! 🎉',
        'Your petition has been created successfully! You earned +5 points.',
        [{ text: 'OK', onPress: () => onSuccess && onSuccess(data) }]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to create petition. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Petition</Text>
        <TouchableOpacity onPress={saveDraft}>
          <Text style={styles.draftButton}>Save Draft</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Enter a clear, concise title..."
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              maxLength={150}
            />
            <View style={styles.inputFooter}>
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              <Text style={styles.characterCount}>
                {characterCounts.title}/150
              </Text>
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    formData.category === cat.id && styles.categoryChipActive
                  ]}
                  onPress={() => handleInputChange('category', cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === cat.id && styles.categoryTextActive
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                errors.description && styles.inputError
              ]}
              placeholder="Describe your petition in detail. What problem are you addressing? What change do you want to see?"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={8}
              maxLength={5000}
              textAlignVertical="top"
            />
            <View style={styles.inputFooter}>
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
              <Text style={styles.characterCount}>
                {characterCounts.description}/5000
              </Text>
            </View>
          </View>

          {/* Image Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Featured Image (Optional)</Text>
            {selectedImage ? (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                >
                  <Text style={styles.removeImageIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => setShowImageOptions(true)}
              >
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Add Image</Text>
                <Text style={styles.uploadHint}>
                  Images help your petition stand out
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips for Success</Text>
            <Text style={styles.tipItem}>• Be clear and specific about the issue</Text>
            <Text style={styles.tipItem}>• Explain why this matters to the community</Text>
            <Text style={styles.tipItem}>• Include relevant facts and data</Text>
            <Text style={styles.tipItem}>• Propose a realistic solution</Text>
            <Text style={styles.tipItem}>• Add a compelling image</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Petition</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Options Modal */}
      {showImageOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.imageOptionsModal}>
            <Text style={styles.modalTitle}>Add Image</Text>
            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => handleImagePick('camera')}
            >
              <Text style={styles.imageOptionIcon}>📷</Text>
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => handleImagePick('library')}
            >
              <Text style={styles.imageOptionIcon}>🖼️</Text>
              <Text style={styles.imageOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 60,
  },
  backIcon: {
    fontSize: 24,
    color: '#0066FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  draftButton: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 150,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    flex: 1,
  },
  characterCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  categoriesScroll: {
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: '#8E8E93',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  tipsCard: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0066FF',
  },
  tipItem: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 22,
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#0066FF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imageOptionsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginBottom: 12,
  },
  imageOptionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
