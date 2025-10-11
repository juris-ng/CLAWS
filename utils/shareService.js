import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Platform, Share } from 'react-native';
import { SocialService } from './socialService';

export const ShareService = {
  // Generate shareable link for petition
  generatePetitionLink: (petitionId, petitionTitle) => {
    // In production, replace with your actual domain
    const baseUrl = 'https://yourapp.com'; // TODO: Replace with actual domain
    return `${baseUrl}/petition/${petitionId}`;
  },

  // Generate share text
  generateShareText: (petition) => {
    return `🗳️ ${petition.title}\n\n${petition.description.substring(0, 100)}...\n\nVote now and make your voice heard!`;
  },

  // Share to WhatsApp
  shareToWhatsApp: async (petition, userId) => {
    try {
      const text = ShareService.generateShareText(petition);
      const link = ShareService.generatePetitionLink(petition.id, petition.title);
      const message = `${text}\n\n${link}`;

      const whatsappUrl = Platform.select({
        ios: `whatsapp://send?text=${encodeURIComponent(message)}`,
        android: `whatsapp://send?text=${encodeURIComponent(message)}`,
      });

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        await SocialService.trackShare(petition.id, userId, 'whatsapp');
        return { success: true };
      } else {
        Alert.alert('WhatsApp Not Installed', 'Please install WhatsApp to share');
        return { success: false, error: 'WhatsApp not installed' };
      }
    } catch (error) {
      console.error('Share to WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  },

  // Share to Twitter/X
  shareToTwitter: async (petition, userId) => {
    try {
      const text = ShareService.generateShareText(petition);
      const link = ShareService.generatePetitionLink(petition.id, petition.title);
      const tweetText = `${text.substring(0, 200)}... ${link} #CivicEngagement #MakeChange`;

      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

      const canOpen = await Linking.canOpenURL(twitterUrl);
      
      if (canOpen) {
        await Linking.openURL(twitterUrl);
        await SocialService.trackShare(petition.id, userId, 'twitter');
        return { success: true };
      } else {
        Alert.alert('Error', 'Could not open Twitter');
        return { success: false, error: 'Cannot open Twitter' };
      }
    } catch (error) {
      console.error('Share to Twitter error:', error);
      return { success: false, error: error.message };
    }
  },

  // Share to Facebook
  shareToFacebook: async (petition, userId) => {
    try {
      const link = ShareService.generatePetitionLink(petition.id, petition.title);
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;

      const canOpen = await Linking.canOpenURL(facebookUrl);
      
      if (canOpen) {
        await Linking.openURL(facebookUrl);
        await SocialService.trackShare(petition.id, userId, 'facebook');
        return { success: true };
      } else {
        Alert.alert('Error', 'Could not open Facebook');
        return { success: false, error: 'Cannot open Facebook' };
      }
    } catch (error) {
      console.error('Share to Facebook error:', error);
      return { success: false, error: error.message };
    }
  },

  // Share via Email
  shareViaEmail: async (petition, userId) => {
    try {
      const subject = `🗳️ ${petition.title}`;
      const body = `${ShareService.generateShareText(petition)}\n\n${ShareService.generatePetitionLink(petition.id, petition.title)}`;
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const canOpen = await Linking.canOpenURL(emailUrl);
      
      if (canOpen) {
        await Linking.openURL(emailUrl);
        await SocialService.trackShare(petition.id, userId, 'email');
        return { success: true };
      } else {
        Alert.alert('Error', 'Could not open email app');
        return { success: false, error: 'Cannot open email' };
      }
    } catch (error) {
      console.error('Share via email error:', error);
      return { success: false, error: error.message };
    }
  },

  // Copy link to clipboard
  copyLink: async (petition, userId) => {
    try {
      const link = ShareService.generatePetitionLink(petition.id, petition.title);
      await Clipboard.setStringAsync(link);
      await SocialService.trackShare(petition.id, userId, 'copy_link');
      Alert.alert('Link Copied! 📋', 'Petition link copied to clipboard');
      return { success: true };
    } catch (error) {
      console.error('Copy link error:', error);
      Alert.alert('Error', 'Failed to copy link');
      return { success: false, error: error.message };
    }
  },

  // Native share sheet (iOS/Android)
  shareNative: async (petition, userId) => {
    try {
      const text = ShareService.generateShareText(petition);
      const link = ShareService.generatePetitionLink(petition.id, petition.title);
      const message = `${text}\n\n${link}`;

      const result = await Share.share({
        message,
        title: petition.title,
        url: link, // iOS only
      });

      if (result.action === Share.sharedAction) {
        await SocialService.trackShare(petition.id, userId, 'native_share');
        return { success: true };
      } else if (result.action === Share.dismissedAction) {
        return { success: false, error: 'Share cancelled' };
      }
    } catch (error) {
      console.error('Native share error:', error);
      return { success: false, error: error.message };
    }
  },

  // Show share options
  showShareOptions: (petition, userId, onSelectOption) => {
    const options = [
      { label: 'WhatsApp', icon: '💬', action: () => ShareService.shareToWhatsApp(petition, userId) },
      { label: 'Twitter/X', icon: '🐦', action: () => ShareService.shareToTwitter(petition, userId) },
      { label: 'Facebook', icon: '👥', action: () => ShareService.shareToFacebook(petition, userId) },
      { label: 'Email', icon: '📧', action: () => ShareService.shareViaEmail(petition, userId) },
      { label: 'Copy Link', icon: '📋', action: () => ShareService.copyLink(petition, userId) },
      { label: 'More Options', icon: '⋯', action: () => ShareService.shareNative(petition, userId) },
    ];

    return options;
  },
};
