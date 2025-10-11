import { AppRegistry, StyleSheet, Text, View } from 'react-native';

function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ App Works!</Text>
      <Text style={styles.subtitle}>Governance App</Text>
      <Text style={styles.info}>Build successful</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#333',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: '#666',
  },
});

// CRITICAL: Register the app component
AppRegistry.registerComponent('main', () => App);

export default App;
