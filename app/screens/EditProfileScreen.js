import { useState } from 'react';
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
import { ProfileService } from '../../utils/profileService';
import { UploadService } from '../../utils/uploadService';

export default function EditProfileScreen({ user, profile, onBack, onUpdate }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    phone_number: profile?.phone_number || '',
    location: profile?.location || '',
  });
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      setAvatarUri(image.uri);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setLoading(true);

    try {
      // Upload avatar if changed
      if (avatarUri && avatarUri !== profile?.avatar_url) {
        const result = await ProfileService.uploadAvatar(user.id, avatarUri);
        if (!result.success) {
          throw new Error('Failed to upload avatar');
        }
      }

      // Update profile
      const result = await ProfileService.updateProfile(user.id, formData);

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => onUpdate(result.data) }
        ]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarDisplay = () => {
    if (avatarUri) {
      return <Image source={{ uri: avatarUri }} style={styles.avatar} />;
    }
    const initials = formData.full_name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
    );
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {getAvatarDisplay()}
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={() => setShowImageOptions(true)}
          >
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={formData.full_name}
              onChangeText={(text) => handleInputChange('full_name', text)}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {formData.bio?.length || 0}/500
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+254 XXX XXX XXX"
              value={formData.phone_number}
              onChangeText={(text) => handleInputChange('phone_number', text)}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="City, Country"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile?.email}
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </View>
      </ScrollView>

      {/* Image Options Modal */}
      {showImageOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.imageOptionsModal}>
            <Text style={styles.modalTitle}>Change Profile Photo</Text>
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
            {avatarUri && (
              <TouchableOpacity
                style={[styles.imageOption, styles.removeOption]}
                onPress={() => {
                  setAvatarUri(null);
                  setShowImageOptions(false);
                }}
              >
                <Text style={styles.imageOptionIcon}>🗑️</Text>
                <Text style={[styles.imageOptionText, styles.removeText]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066FF" />
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
  saveButton: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  inputDisabled: {
    backgroundColor: '#F2F2F7',
    color: '#8E8E93',
  },
  characterCount: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
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
  removeOption: {
    backgroundColor: '#FFEBEE',
  },
  imageOptionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeText: {
    color: '#FF3B30',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
