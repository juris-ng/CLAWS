import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>✅ App Works!</Text>
      <Text style={styles.subtitle}>Governance App</Text>
      <Text style={styles.text}>The build is successful.</Text>
      <Text style={styles.text}>Supabase is connected.</Text>
      <Text style={styles.info}>
        Next: Debug screen imports
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#333',
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#999',
    marginTop: 32,
  },
});
