import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CreatePetitionTypeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Petition</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>Choose petition type:</Text>

          {/* Global Petition Option */}
          <TouchableOpacity
            style={styles.option}
            onPress={() =>
              navigation.navigate('PetitionComposer', { petitionType: 'global' })
            }
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.globalIcon]}>
              <Text style={styles.optionIcon}>🌍</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Global Petition</Text>
              <Text style={styles.optionDescription}>
                Visible to all members on the home screen. Reach the entire community with your petition.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color="#007AFF"
              style={styles.chevron}
            />
          </TouchableOpacity>

          {/* Body-Only Petition Option */}
          <TouchableOpacity
            style={styles.option}
            onPress={() =>
              navigation.navigate('PetitionComposer', { petitionType: 'body' })
            }
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.bodyIcon]}>
              <Text style={styles.optionIcon}>🏢</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Body-Only Petition</Text>
              <Text style={styles.optionDescription}>
                Visible only to members of the body you select. Keep petitions within your organization.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color="#007AFF"
              style={styles.chevron}
            />
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              You can edit visibility settings after creating your petition.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  globalIcon: {
    backgroundColor: '#E8F5E9',
  },
  bodyIcon: {
    backgroundColor: '#E3F2FD',
  },
  optionIcon: {
    fontSize: 32,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  chevron: {
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#1565C0',
    flex: 1,
    fontWeight: '500',
  },
});
