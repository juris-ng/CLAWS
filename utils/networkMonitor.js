import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

let isConnected = true;
let connectionType = 'unknown';

export const NetworkMonitor = {
  // Initialize network monitoring
  initialize: (onConnectionChange) => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      isConnected = state.isConnected;
      connectionType = state.type;

      console.log('Network state:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Notify about connection change
      if (wasConnected && !state.isConnected) {
        Alert.alert(
          '📵 No Internet Connection',
          'You are now offline. Some features may be limited.',
          [{ text: 'OK' }]
        );
      } else if (!wasConnected && state.isConnected) {
        Alert.alert(
          '✅ Back Online',
          'Internet connection restored!',
          [{ text: 'OK' }]
        );
      }

      if (onConnectionChange) {
        onConnectionChange(state.isConnected, state.type);
      }
    });

    return unsubscribe;
  },

  // Check current connection status
  checkConnection: async () => {
    const state = await NetInfo.fetch();
    isConnected = state.isConnected;
    connectionType = state.type;
    return {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    };
  },

  // Get connection status
  isConnected: () => isConnected,

  // Get connection type
  getConnectionType: () => connectionType,

  // Show offline alert if not connected
  showOfflineAlert: () => {
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return true;
    }
    return false;
  },
};
