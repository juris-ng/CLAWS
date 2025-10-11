import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const PushNotificationService = {
  // Register for push notifications
  registerForPushNotifications: async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0066FF',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      console.log('Push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  },

  // Save push token to database
  savePushToken: async (userId, token) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ push_token: token })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Save push token error:', error);
      return { success: false, error: error.message };
    }
  },

  // Schedule local notification
  scheduleNotification: async (title, body, data = {}, triggerSeconds = 1) => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: triggerSeconds > 0 ? { seconds: triggerSeconds } : null,
      });
      return id;
    } catch (error) {
      console.error('Schedule notification error:', error);
      return null;
    }
  },

  // Send push notification via API (for backend integration)
  sendPushNotification: async (expoPushToken, title, body, data = {}) => {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      return { success: true };
    } catch (error) {
      console.error('Send push notification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel all notifications
  cancelAllNotifications: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Get notification permissions
  getPermissions: async () => {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  // Add notification listener
  addNotificationListener: (callback) => {
    return Notifications.addNotificationReceivedListener(callback);
  },

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener: (callback) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  // Remove listeners
  removeNotificationListeners: (subscriptions) => {
    subscriptions.forEach((subscription) => {
      subscription.remove();
    });
  },
};
