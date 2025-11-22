import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import AnonymousToggle from '../components/AnonymousToggle';


const AnonymousSettingsScreen = ({ navigation }) => {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadMemberData();
  }, []);


  const loadMemberData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single();


      if (error) throw error;
      setMember(data);
    } catch (error) {
      console.error('Error loading member:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };


  const handleAnonymousToggle = (isAnonymous, updatedData) => {
    setMember(updatedData);
  };


  if (loading || !member) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Privacy & Anonymity</Text>
          <Text style={styles.headerSubtitle}>
            Protect your identity while making your voice heard
          </Text>
        </View>


        <View style={styles.section}>
          <AnonymousToggle
            memberId={member.id}
            currentStatus={member.is_anonymous}
            onToggle={handleAnonymousToggle}
          />


          {member.is_anonymous && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Your Anonymous Identity</Text>
              <Text style={styles.anonymousName}>
                {member.anonymous_display_name}
              </Text>
              <Text style={styles.infoText}>
                This is how other users will see you when anonymous mode is enabled.
              </Text>
            </View>
          )}
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Anonymous Mode Does</Text>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Protects Your Identity</Text>
              <Text style={styles.featureDescription}>
                Your real name and profile picture will be hidden
              </Text>
            </View>
          </View>


          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📝</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Anonymous Petitions</Text>
              <Text style={styles.featureDescription}>
                Create petitions without revealing your identity
              </Text>
            </View>
          </View>


          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🚨</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Whistle-blowing</Text>
              <Text style={styles.featureDescription}>
                Report issues safely without fear of retaliation
              </Text>
            </View>
          </View>


          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Secure Activism</Text>
              <Text style={styles.featureDescription}>
                Participate in activism while maintaining privacy
              </Text>
            </View>
          </View>
        </View>


        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Note: While we protect your public identity, platform administrators
            can still see your real identity for security and accountability purposes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0066FF',
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  anonymousName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#558B2F',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
  },
});


export default AnonymousSettingsScreen;
