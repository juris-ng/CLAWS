import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// CLAWS Brand Colors
const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  secondary: '#FF6B35',
  secondaryDark: '#E85A2A',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  orange: '#FF9800',
  green: '#4CAF50',
};

const RoleSelectionScreen = ({ navigation }) => {
  const roles = [
    {
      id: 'member',
      title: 'Member',
      icon: 'person',
      description: 'Join the community',
      color: COLORS.primary,
      screen: 'MemberRegistration',
    },
    {
      id: 'body',
      title: 'Body/Organization',
      icon: 'business',
      description: 'Represent organizations',
      color: COLORS.orange,
      screen: 'RegisterBody',
    },
    {
      id: 'lawyer',
      title: 'Lawyer',
      icon: 'briefcase',
      description: 'Provide legal support',
      color: COLORS.green,
      screen: 'RegisterLawyer',
    },
  ];

  const handleRoleSelect = (role) => {
    navigation.navigate(role.screen);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* Flexible spacer at top */}
        <View style={styles.topSpacer} />

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Ionicons name="people" size={80} color={COLORS.primary} />
          <Ionicons
            name="heart"
            size={28}
            color={COLORS.secondary}
            style={styles.heartIcon}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Your Role</Text>
          <Text style={styles.headerSubtitle}>Select how you want to participate</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={styles.roleCard}
              onPress={() => handleRoleSelect(role)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: role.color }]}>
                <Ionicons name={role.icon} size={28} color={COLORS.white} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Terms & Privacy */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>By continuing, you agree to our </Text>
          <TouchableOpacity onPress={() => Alert.alert('Terms of Service')}>
            <Text style={styles.termsLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> and </Text>
          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy')}>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>
          </Text>
        </TouchableOpacity>

        {/* Flexible spacer at bottom */}
        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Balanced flex spacers
  topSpacer: {
    flex: 0.3,
  },
  bottomSpacer: {
    flex: 0.15,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  heartIcon: {
    position: 'absolute',
    top: -5,
    right: '36%',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },

  // Roles Container
  rolesContainer: {
    marginBottom: 20,
  },

  // Role Card
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Icon Container
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  // Role Info
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },

  // Terms & Privacy
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  termsText: {
    fontSize: 11,
    color: COLORS.mediumGray,
  },
  termsLink: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Login Link
  loginLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default RoleSelectionScreen;
