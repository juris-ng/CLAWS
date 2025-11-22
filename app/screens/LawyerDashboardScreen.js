import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View } from 'react-native';


// Main Lawyer Screens
import LawyerAnalyticsDashboardScreen from './LawyerAnalyticsDashboardScreen';
import LawyerProfileScreen from './LawyerProfileScreen';
import LawyerSelectionScreen from './LawyerSelectionScreen';
import LawyersListScreen from './LawyersListScreen';


// Cases
import CaseDetailScreen from './CaseDetailScreen';
import CasesScreen from './CasesScreen';
import CreateCaseScreen from './CreateCaseScreen';
import MyCasesScreen from './MyCasesScreen';


// Consultations
import BookConsultationScreen from './BookConsultationScreen';
import MyConsultationsScreen from './MyConsultationsScreen';


// Messages & Communication
import ConversationDetailScreen from './ConversationDetailScreen';
import ConversationsListScreen from './ConversationsListScreen';
import InboxScreen from './InboxScreen';


// Notifications
import NotificationsScreen from './NotificationsScreen';


// Settings & Profile
import EditProfileScreen from './EditProfileScreen';
import SettingsScreen from './SettingsScreen';


// Analytics & Reports
import ImpactTrackingScreen from './ImpactTrackingScreen';
import PerformanceReportsScreen from './PerformanceReportsScreen';


// Feedback & Surveys
import SubmitFeedbackScreen from './SubmitFeedbackScreen';
import TakeSurveyScreen from './TakeSurveyScreen';


// QnA Sessions
import QnASessionDetailScreen from './QnASessionDetailScreen';
import QnASessionsScreen from './QnASessionsScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();


// ✅ PLACEHOLDER SCREENS FOR MISSING COMPONENTS
const PlaceholderScreen = ({ route }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>
      {route.name} Screen
    </Text>
    <Text style={styles.placeholderSubtext}>
      Coming Soon
    </Text>
  </View>
);


// HOME STACK (Dashboard)
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="LawyerDashboardHome"
        component={LawyersListScreen} 
      />
      <Stack.Screen 
        name="LawyerAnalytics" 
        component={LawyerAnalyticsDashboardScreen} 
      />
      <Stack.Screen 
        name="PerformanceReports" 
        component={PerformanceReportsScreen} 
      />
      <Stack.Screen 
        name="ImpactTracking" 
        component={ImpactTrackingScreen} 
      />
    </Stack.Navigator>
  );
}


// BODIES STACK (Lawyers List)
function BodiesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="LawyerSelection" 
        component={LawyerSelectionScreen}
      />
    </Stack.Navigator>
  );
}


// CASES STACK
function CasesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="CasesList" 
        component={CasesScreen} 
      />
      <Stack.Screen 
        name="MyCases" 
        component={MyCasesScreen} 
      />
      <Stack.Screen 
        name="CaseDetail" 
        component={CaseDetailScreen} 
      />
      <Stack.Screen 
        name="CreateCase" 
        component={CreateCaseScreen} 
      />
      <Stack.Screen 
        name="BookConsultation" 
        component={BookConsultationScreen} 
      />
      <Stack.Screen 
        name="ConsultationsList" 
        component={MyConsultationsScreen} 
      />
    </Stack.Navigator>
  );
}


// INBOX STACK (Messages)
function InboxStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MessagesList" 
        component={InboxScreen} 
      />
      <Stack.Screen 
        name="ConversationsList" 
        component={ConversationsListScreen} 
      />
      <Stack.Screen 
        name="ConversationDetail" 
        component={ConversationDetailScreen} 
      />
    </Stack.Navigator>
  );
}


// DISCOVER STACK (Profile)
function DiscoverStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="LawyerProfileMain" 
        component={LawyerProfileScreen}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
      />
      <Stack.Screen 
        name="SubmitFeedback" 
        component={SubmitFeedbackScreen} 
      />
      <Stack.Screen 
        name="TakeSurvey" 
        component={TakeSurveyScreen} 
      />
      <Stack.Screen 
        name="QnASessions" 
        component={QnASessionsScreen} 
      />
      <Stack.Screen 
        name="QnASessionDetail" 
        component={QnASessionDetailScreen} 
      />
      <Stack.Screen 
        name="PointsHistory" 
        component={PlaceholderScreen} 
      />
      <Stack.Screen 
        name="RegisterLawyer" 
        component={PlaceholderScreen} 
      />
    </Stack.Navigator>
  );
}


// MAIN TAB NAVIGATOR
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Bodies') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Cases') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Inbox') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      
      <Tab.Screen 
        name="Bodies" 
        component={BodiesStackNavigator}
        options={{
          tabBarLabel: 'Bodies',
        }}
      />
      
      <Tab.Screen 
        name="Cases" 
        component={CasesStackNavigator}
        options={{
          tabBarLabel: 'Cases',
        }}
      />
      
      <Tab.Screen 
        name="Inbox" 
        component={InboxStackNavigator}
        options={{
          tabBarLabel: 'Inbox',
        }}
      />
      
      <Tab.Screen 
        name="Discover" 
        component={DiscoverStackNavigator}
        options={{
          tabBarLabel: 'Discover',
        }}
      />
    </Tab.Navigator>
  );
}


// ✅ REMOVED NavigationContainer - it's handled by AppNavigator
const LawyerDashboardScreen = () => {
  return <TabNavigator />;
};


// ✅ STYLES FOR PLACEHOLDER
const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
  },
});


export default LawyerDashboardScreen;
