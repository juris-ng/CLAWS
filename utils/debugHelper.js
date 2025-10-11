import { Alert } from 'react-native';

export const DebugHelper = {
  // Log detailed error information
  logError: (error, context = 'Unknown') => {
    console.error(`\n❌ ERROR in ${context}`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    if (error.code) console.error('Code:', error.code);
    console.error('---\n');
  },

  // Show debug alert
  showDebugAlert: (title, data) => {
    if (__DEV__) {
      Alert.alert(
        `🐛 DEBUG: ${title}`,
        JSON.stringify(data, null, 2),
        [{ text: 'OK' }]
      );
    }
  },

  // Log API response
  logApiResponse: (endpoint, response) => {
    if (__DEV__) {
      console.log(`\n📡 API Response: ${endpoint}`);
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('---\n');
    }
  },

  // Check app state
  checkAppState: () => {
    if (__DEV__) {
      console.log('\n🔍 APP STATE CHECK');
      console.log('Environment:', __DEV__ ? 'Development' : 'Production');
      console.log('Platform:', Platform.OS);
      console.log('---\n');
    }
  },

  // Network diagnostics
  networkDiagnostics: async () => {
    const NetInfo = require('@react-native-community/netinfo');
    const state = await NetInfo.fetch();
    console.log('\n🌐 NETWORK DIAGNOSTICS');
    console.log('Connected:', state.isConnected);
    console.log('Type:', state.type);
    console.log('Internet Reachable:', state.isInternetReachable);
    console.log('---\n');
  },
};
