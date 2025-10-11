import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

export const UploadService = {
  // Request permissions
  requestMediaPermissions: async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload images!');
      return false;
    }
    return true;
  },

  requestCameraPermissions: async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to take photos!');
      return false;
    }
    return true;
  },

  // Pick image from library
  pickImage: async () => {
    const hasPermission = await UploadService.requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      return result.assets[0];
    }
    return null;
  },

  // Take photo with camera
  takePhoto: async () => {
    const hasPermission = await UploadService.requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      return result.assets[0];
    }
    return null;
  },

  // Upload file to Supabase Storage
  uploadFile: async (userId, fileUri, fileName) => {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      // Create file path: userId/timestamp-filename
      const timestamp = Date.now();
      const fileExt = fileName.split('.').pop();
      const filePath = `${userId}/${timestamp}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('petition-media')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('petition-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Upload multiple images
  uploadMultipleImages: async (userId, images) => {
    const uploadPromises = images.map((image) =>
      UploadService.uploadFile(userId, image.uri, image.fileName || 'image.jpg')
    );
    return await Promise.all(uploadPromises);
  },

  // Delete file from storage
  deleteFile: async (fileUrl) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/petition-media/');
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('petition-media')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  },
};
