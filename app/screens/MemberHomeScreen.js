import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Main Tab Screens
import DiscoverScreen from './DiscoverScreen';
import HomeScreen from './HomeScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import SearchScreen from './SearchScreen';

// Petition Screens
import CreatePetitionScreen from './CreatePetitionScreen';
import ManagePetitions from './ManagePetitions';
import PetitionComposerScreen from './PetitionComposerScreen';
import PetitionDetailEnhanced from './PetitionDetailEnhanced';
import PetitionDetailScreen from './PetitionDetailScreen';

// Profile & Settings
import AnonymousSettingsScreen from './AnonymousSettingsScreen';
import EditProfileScreen from './EditProfileScreen';
import SettingsScreen from './SettingsScreen';

// Points & Leaderboard
import LeaderboardScreen from './LeaderboardScreen';
import LeaderboardsScreen from './LeaderboardsScreen';
import PointsHistoryScreen from './PointsHistoryScreen';
import PointsRedemptionScreen from './PointsRedemptionScreen';
import ReputationLeaderboardScreen from './ReputationLeaderboardScreen';

// Messaging & Social
import ConversationDetailScreen from './ConversationDetailScreen';
import ConversationsListScreen from './ConversationsListScreen';
import FollowersScreen from './FollowersScreen';
import FollowingScreen from './FollowingScreen';
import InboxScreen from './InboxScreen';

// Whistleblowing
import CreateWhistleblowScreen from './CreateWhistleblowScreen';
import WhistleblowDetailScreen from './WhistleblowDetailScreen';
import WhistleblowListScreen from './WhistleblowListScreen';

// Ideas & Resources
import CreateResourceScreen from './CreateResourceScreen';
import IdeasComposerScreen from './IdeasComposerScreen';
import IdeasScreen from './IdeasScreen';
import ResourceSharingScreen from './ResourceSharingScreen';

// Bodies Directory
import BodiesDirectory from './BodiesDirectory';
import BodiesListScreen from './BodiesListScreen';
import BodyProfileScreen from './BodyProfileScreen';

// Lawyers
import BookConsultationScreen from './BookConsultationScreen';
import LawyerProfileScreen from './LawyerProfileScreen';
import LawyerSelectionScreen from './LawyerSelectionScreen';
import LawyersListScreen from './LawyersListScreen';

// Cases & Legal
import CaseDetailScreen from './CaseDetailScreen';
import CreateCaseScreen from './CreateCaseScreen';
import MyCasesScreen from './MyCasesScreen';
import MyConsultationsScreen from './MyConsultationsScreen';

// Appeals & Surveys
import MemberSurveysScreen from './MemberSurveysScreen';
import MyAppealsScreen from './MyAppealsScreen';
import SubmitFeedbackScreen from './SubmitFeedbackScreen';
import TakeSurveyScreen from './TakeSurveyScreen';

// QnA Sessions
import QnASessionDetailScreen from './QnASessionDetailScreen';
import QnASessionsScreen from './QnASessionsScreen';

// Onboarding & User Profile
import UserProfileViewScreen from './UserProfileViewScreen';

// Analytics & Activity
import ActivityHistoryScreen from './ActivityHistoryScreen';
import ImpactTrackingScreen from './ImpactTrackingScreen';
import PerformanceReportsScreen from './PerformanceReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// HOME STACK
function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Feed" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PetitionDetail" component={PetitionDetailScreen} options={{ title: 'Petition' }} />
      <Stack.Screen name="PetitionDetailEnhanced" component={PetitionDetailEnhanced} options={{ title: 'Petition Details' }} />
      <Stack.Screen name="CreatePetition" component={CreatePetitionScreen} options={{ title: 'Create Petition' }} />
      <Stack.Screen name="PetitionComposer" component={PetitionComposerScreen} options={{ title: 'Compose Petition' }} />
      <Stack.Screen name="ManagePetitions" component={ManagePetitions} options={{ title: 'My Petitions' }} />
      <Stack.Screen name="BodyProfile" component={BodyProfileScreen} options={{ title: 'Organization' }} />
      <Stack.Screen name="UserProfile" component={UserProfileViewScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

// BODIES STACK
function BodiesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BodiesFeed" component={BodiesListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BodiesDirectory" component={BodiesDirectory} options={{ title: 'Directory' }} />
      <Stack.Screen name="BodyProfile" component={BodyProfileScreen} options={{ title: 'Organization' }} />
      <Stack.Screen name="LawyersList" component={LawyersListScreen} options={{ title: 'Lawyers' }} />
      <Stack.Screen name="LawyerProfile" component={LawyerProfileScreen} options={{ title: 'Lawyer' }} />
    </Stack.Navigator>
  );
}

// CASES STACK
function CasesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CasesFeed" component={MyCasesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: 'Case Details' }} />
      <Stack.Screen name="CreateCase" component={CreateCaseScreen} options={{ title: 'New Case' }} />
      <Stack.Screen name="LawyerSelection" component={LawyerSelectionScreen} options={{ title: 'Find Lawyer' }} />
      <Stack.Screen name="BookConsultation" component={BookConsultationScreen} options={{ title: 'Book Consultation' }} />
      <Stack.Screen name="MyConsultations" component={MyConsultationsScreen} options={{ title: 'Consultations' }} />
    </Stack.Navigator>
  );
}

// INBOX STACK
function InboxStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="InboxMain" component={InboxScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ConversationsList" component={ConversationsListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="ConversationDetail" component={ConversationDetailScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

// DISCOVER STACK
function DiscoverStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DiscoverFeed" component={DiscoverScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="PetitionDetail" component={PetitionDetailScreen} options={{ title: 'Petition' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="AnonymousSettings" component={AnonymousSettingsScreen} options={{ title: 'Anonymous Mode' }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
      <Stack.Screen name="Leaderboards" component={LeaderboardsScreen} options={{ title: 'Rankings' }} />
      <Stack.Screen name="ReputationLeaderboard" component={ReputationLeaderboardScreen} options={{ title: 'Reputation' }} />
      <Stack.Screen name="PointsHistory" component={PointsHistoryScreen} options={{ title: 'Points History' }} />
      <Stack.Screen name="PointsRedemption" component={PointsRedemptionScreen} options={{ title: 'Redeem Points' }} />
      <Stack.Screen name="MyAppeals" component={MyAppealsScreen} options={{ title: 'My Appeals' }} />
      <Stack.Screen name="Followers" component={FollowersScreen} options={{ title: 'Followers' }} />
      <Stack.Screen name="Following" component={FollowingScreen} options={{ title: 'Following' }} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} options={{ title: 'Activity' }} />
      <Stack.Screen name="WhistleblowList" component={WhistleblowListScreen} options={{ title: 'Whistleblowing' }} />
      <Stack.Screen name="WhistleblowDetail" component={WhistleblowDetailScreen} options={{ title: 'Report Details' }} />
      <Stack.Screen name="CreateWhistleblow" component={CreateWhistleblowScreen} options={{ title: 'Report Issue' }} />
      <Stack.Screen name="Ideas" component={IdeasScreen} options={{ title: 'Ideas' }} />
      <Stack.Screen name="IdeasComposer" component={IdeasComposerScreen} options={{ title: 'Share Idea' }} />
      <Stack.Screen name="ResourceSharing" component={ResourceSharingScreen} options={{ title: 'Resources' }} />
      <Stack.Screen name="CreateResource" component={CreateResourceScreen} options={{ title: 'Share Resource' }} />
      <Stack.Screen name="Surveys" component={MemberSurveysScreen} options={{ title: 'Surveys' }} />
      <Stack.Screen name="TakeSurvey" component={TakeSurveyScreen} options={{ title: 'Survey' }} />
      <Stack.Screen name="SubmitFeedback" component={SubmitFeedbackScreen} options={{ title: 'Feedback' }} />
      <Stack.Screen name="QnASessions" component={QnASessionsScreen} options={{ title: 'Q&A Sessions' }} />
      <Stack.Screen name="QnASessionDetail" component={QnASessionDetailScreen} options={{ title: 'Q&A' }} />
      <Stack.Screen name="ImpactTracking" component={ImpactTrackingScreen} options={{ title: 'Impact' }} />
      <Stack.Screen name="PerformanceReports" component={PerformanceReportsScreen} options={{ title: 'Reports' }} />
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
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Cases') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Inbox') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'search' : 'search-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 60,
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
      />
      
      <Tab.Screen 
        name="Bodies" 
        component={BodiesStackNavigator}
      />
      
      <Tab.Screen 
        name="Cases" 
        component={CasesStackNavigator}
      />
      
      <Tab.Screen 
        name="Inbox" 
        component={InboxStackNavigator}
      />
      
      <Tab.Screen 
        name="Discover" 
        component={DiscoverStackNavigator}
      />
    </Tab.Navigator>
  );
}

const MemberHomeScreen = () => {
  return (
    <NavigationContainer independent={true}>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default MemberHomeScreen;
