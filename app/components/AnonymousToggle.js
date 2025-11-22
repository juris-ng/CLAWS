import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { AnonymousService } from '../../utils/anonymousService';

const AnonymousToggle = ({ memberId, currentStatus, onToggle }) => {
  const [isAnonymous, setIsAnonymous] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (value) => {
    setLoading(true);
    
    if (value) {
      // Enabling anonymous mode
      Alert.alert(
        'Enable Anonymous Mode',
        'You will appear as an anonymous activist. Your real identity will be protected.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false)
          },
          {
            text: 'Enable',
            onPress: async () => {
              const result = await AnonymousService.enableAnonymousMode(memberId);
              if (result.success) {
                setIsAnonymous(true);
                onToggle && onToggle(true, result.data);
                Alert.alert('Success', 'Anonymous mode enabled');
              } else {
                Alert.alert('Error', result.error);
              }
              setLoading(false);
            }
          }
        ]
      );
    } else {
      // Disabling anonymous mode
      const result = await AnonymousService.disableAnonymousMode(memberId);
      if (result.success) {
        setIsAnonymous(false);
        onToggle && onToggle(false, result.data);
        Alert.alert('Success', 'Anonymous mode disabled');
      } else {
        Alert.alert('Error', result.error);
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Anonymous Mode</Text>
        <Text style={styles.subtitle}>
          {isAnonymous 
            ? 'Your identity is protected' 
            : 'Show your real name'}
        </Text>
      </View>
      <Switch
        value={isAnonymous}
        onValueChange={handleToggle}
        disabled={loading}
        trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
        thumbColor={isAnonymous ? '#2E7D32' : '#f4f3f4'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
});

export default AnonymousToggle;
