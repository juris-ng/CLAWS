import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import CustomDrawer from '../app/components/CustomDrawer';
import { useAuth } from '../contexts/AuthContext';




// ============================================================================
// ALL IMPORTS - COMPLETE LIST
// ============================================================================




// Main Screens
import DiscoverScreen from '../app/screens/DiscoverScreen';
import HomeScreen from '../app/screens/HomeScreen';
import InboxScreen from '../app/screens/InboxScreen';
import NotificationsScreen from '../app/screens/NotificationsScreen';
import ProfileScreen from '../app/screens/ProfileScreen';




// Auth Screens
import AuthScreen from '../app/screens/AuthScreen';
import Login from '../app/screens/Login';
import MemberRegistration from '../app/screens/MemberRegistration';
import OnboardingScreen from '../app/screens/OnboardingScreen';
import RegisterBodyScreen from '../app/screens/RegisterBodyScreen';
import RegisterLawyerScreen from '../app/screens/RegisterLawyerScreen';
import RoleSelectionScreen from '../app/screens/RoleSelectionScreen';




// Petitions
import CreatePetitionScreen from '../app/screens/CreatePetitionScreen';
import CreatePetitionTypeScreen from '../app/screens/CreatePetitionTypeScreen';
import ManagePetitions from '../app/screens/ManagePetitions';
import PetitionComposerScreen from '../app/screens/PetitionComposerScreen';
import PetitionDetailEnhanced from '../app/screens/PetitionDetailEnhanced';
import PetitionDetailScreen from '../app/screens/PetitionDetailScreen';




// Profile & Settings
import AnonymousSettingsScreen from '../app/screens/AnonymousSettingsScreen';
import ChangePassword from '../app/screens/ChangePassword';
import EditProfileScreen from '../app/screens/EditProfileScreen';
import SettingsScreen from '../app/screens/SettingsScreen';




// Points & Leaderboard
import LeaderboardScreen from '../app/screens/LeaderboardScreen';
import LeaderboardsScreen from '../app/screens/LeaderboardsScreen';
import PointsHistoryScreen from '../app/screens/PointsHistoryScreen';
import PointsRedemptionScreen from '../app/screens/PointsRedemptionScreen';
import ReputationLeaderboardScreen from '../app/screens/ReputationLeaderboardScreen';




// Messaging & Social
import ConversationDetailScreen from '../app/screens/ConversationDetailScreen';
import ConversationsListScreen from '../app/screens/ConversationsListScreen';
import FollowersScreen from '../app/screens/FollowersScreen';
import FollowingScreen from '../app/screens/FollowingScreen';




// Whistleblowing
import CreateWhistleblowScreen from '../app/screens/CreateWhistleblowScreen';
import WhistleblowDetailScreen from '../app/screens/WhistleblowDetailScreen';
import WhistleblowListScreen from '../app/screens/WhistleblowListScreen';




// Ideas & Resources
import CreateResourceScreen from '../app/screens/CreateResourceScreen';
import IdeasComposerScreen from '../app/screens/IdeasComposerScreen';
import IdeasScreen from '../app/screens/IdeasScreen';
import ResourceSharingScreen from '../app/screens/ResourceSharingScreen';




// Bodies/Organizations
import BodiesDirectory from '../app/screens/BodiesDirectory';
import BodiesListScreen from '../app/screens/BodiesListScreen';
import BodyActivityLogScreen from '../app/screens/BodyActivityLogScreen';
import BodyAnalyticsDashboardScreen from '../app/screens/BodyAnalyticsDashboardScreen';
// 🆕 NEW IMPORTS ADDED HERE
import BodyChatScreen from '../app/screens/BodyChatScreen';
import BodyDashboardScreen from '../app/screens/BodyDashboardScreen';
import BodyInfoScreen from '../app/screens/BodyInfoScreen';
// END OF NEW IMPORTS
import BodyMessagesScreen from '../app/screens/BodyMessagesScreen';
import BodyPartnershipsScreen from '../app/screens/BodyPartnershipsScreen';
import BodyPetitionsScreen from '../app/screens/BodyPetitionsScreen';
import BodyPostsScreen from '../app/screens/BodyPostsScreen';
import BodyProfileScreen from '../app/screens/BodyProfileScreen';
import BodySettingsScreen from '../app/screens/BodySettingsScreen';
import BodyTeamScreen from '../app/screens/BodyTeamScreen';
import CreateBodyPostScreen from '../app/screens/CreateBodyPostScreen';
import RateBodyScreen from '../app/screens/RateBodyScreen';




// 🆕 NEW CONTENT CREATION SCREENS
import CreateAnnouncementScreen from '../app/screens/CreateAnnouncementScreen';
import CreateDiscussionScreen from '../app/screens/CreateDiscussionScreen';
import CreateEventScreen from '../app/screens/CreateEventScreen';
import CreateProjectScreen from '../app/screens/CreateProjectScreen';




// 🆕 NEW CONTENT DETAIL SCREENS
import AnnouncementDetailScreen from '../app/screens/AnnouncementDetailScreen';
import DiscussionDetailScreen from '../app/screens/DiscussionDetailScreen';
import EventDetailScreen from '../app/screens/EventDetailScreen';
import ProjectDetailScreen from '../app/screens/ProjectDetailScreen';




// Campaigns & Partnerships
import CreateCampaignScreen from '../app/screens/CreateCampaignScreen';
import CreatePartnershipScreen from '../app/screens/CreatePartnershipScreen';
import JointCampaignsScreen from '../app/screens/JointCampaignsScreen';




// Lawyers
import LawyerAnalyticsDashboardScreen from '../app/screens/LawyerAnalyticsDashboardScreen';
import LawyerProfileScreen from '../app/screens/LawyerProfileScreen';




// Cases & Legal
import CaseDetailScreen from '../app/screens/CaseDetailScreen';
import MyCasesScreen from '../app/screens/MyCasesScreen';
import MyConsultationsScreen from '../app/screens/MyConsultationsScreen';




// Appeals & Surveys
import MemberSurveysScreen from '../app/screens/MemberSurveysScreen';
import MyAppealsScreen from '../app/screens/MyAppealsScreen';
import SubmitFeedbackScreen from '../app/screens/SubmitFeedbackScreen';
import TakeSurveyScreen from '../app/screens/TakeSurveyScreen';




// QnA
import QnASessionDetailScreen from '../app/screens/QnASessionDetailScreen';
import QnASessionsScreen from '../app/screens/QnASessionsScreen';




// Users
import UserProfileViewScreen from '../app/screens/UserProfileViewScreen';




// Analytics
import ActivityHistoryScreen from '../app/screens/ActivityHistoryScreen';
import AnalyticsGoalsScreen from '../app/screens/AnalyticsGoalsScreen';
import ImpactTrackingScreen from '../app/screens/ImpactTrackingScreen';
import PerformanceReportsScreen from '../app/screens/PerformanceReportsScreen';




// Admin
import AdminDecisionsScreen from '../app/screens/AdminDecisionsScreen';
import ConversionHistoryScreen from '../app/screens/ConversionHistoryScreen';
import ReviewDecisionScreen from '../app/screens/ReviewDecisionScreen';




const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();




// ============================================================================
// SHARED SCREENS ARRAY (All users can access these)
// ============================================================================
const SHARED_SCREENS = [
  { name: 'PetitionDetail', component: PetitionDetailScreen },
  { name: 'PetitionDetailEnhanced', component: PetitionDetailEnhanced },
  { name: 'BodyProfile', component: BodyProfileScreen },
  // 🆕 NEW SCREENS ADDED HERE
  { name: 'BodyChat', component: BodyChatScreen },
  { name: 'BodyInfo', component: BodyInfoScreen },
  // END OF NEW SCREENS
  { name: 'UserProfile', component: UserProfileViewScreen },
  { name: 'LawyerProfile', component: LawyerProfileScreen },
  { name: 'EditProfile', component: EditProfileScreen },
  { name: 'Settings', component: SettingsScreen },
  { name: 'ChangePassword', component: ChangePassword },
  { name: 'Notifications', component: NotificationsScreen },
  { name: 'ConversationDetail', component: ConversationDetailScreen },
];




// ============================================================================
// AUTH STACK
// ============================================================================
function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="MemberRegistration" component={MemberRegistration} />
      <Stack.Screen name="RegisterBody" component={RegisterBodyScreen} />
      <Stack.Screen name="RegisterLawyer" component={RegisterLawyerScreen} />
    </Stack.Navigator>
  );
}




// ============================================================================
// MEMBER NAVIGATION - COMPLETE ✅
// ============================================================================
function MemberHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={HomeScreen} />
      <Stack.Screen name="CreatePetition" component={CreatePetitionScreen} />
      <Stack.Screen name="CreatePetitionType" component={CreatePetitionTypeScreen} />
      <Stack.Screen name="PetitionComposer" component={PetitionComposerScreen} />
      <Stack.Screen name="ManagePetitions" component={ManagePetitions} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




// ✅ Bodies Stack - Shows BodiesListScreen
function MemberBodiesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="BodiesList" 
        component={BodiesListScreen}
        options={{ title: 'Organizations' }}
      />
      <Stack.Screen name="BodiesDirectory" component={BodiesDirectory} />
      <Stack.Screen name="RateBody" component={RateBodyScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




// ✅ DASHBOARD STACK FOR LAWYER - Shows all member content
function LawyerDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={LawyerAnalyticsDashboardScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsGoalsScreen} />
      <Stack.Screen name="ImpactTracking" component={ImpactTrackingScreen} />
      <Stack.Screen name="PerformanceReports" component={PerformanceReportsScreen} />
      <Stack.Screen name="MyCases" component={MyCasesScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
      <Stack.Screen name="MyConsultations" component={MyConsultationsScreen} />
      <Stack.Screen name="MyAppeals" component={MyAppealsScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




function MemberInboxStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InboxMain" component={InboxScreen} />
      <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <Stack.Screen name="ConversationDetail" component={ConversationDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}




function MemberDiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="DiscoverMain" 
        component={DiscoverScreen}
        options={{ title: 'Discover' }}
      />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




function MemberProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />




      {/* Leaderboards */}
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Leaderboards" component={LeaderboardsScreen} />
      <Stack.Screen name="ReputationLeaderboard" component={ReputationLeaderboardScreen} />




      {/* Points */}
      <Stack.Screen name="PointsHistory" component={PointsHistoryScreen} />
      <Stack.Screen name="PointsRedemption" component={PointsRedemptionScreen} />




      {/* Settings */}
      <Stack.Screen name="AnonymousSettings" component={AnonymousSettingsScreen} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />




      {/* Cases & Appeals */}
      <Stack.Screen name="MyAppeals" component={MyAppealsScreen} />
      <Stack.Screen name="MyCases" component={MyCasesScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
      <Stack.Screen name="MyConsultations" component={MyConsultationsScreen} />
      <Stack.Screen name="PetitionComposer" component={PetitionComposerScreen} />




      {/* Social */}
      <Stack.Screen name="Followers" component={FollowersScreen} />
      <Stack.Screen name="Following" component={FollowingScreen} />




      {/* Whistleblowing */}
      <Stack.Screen name="WhistleblowList" component={WhistleblowListScreen} />
      <Stack.Screen name="WhistleblowDetail" component={WhistleblowDetailScreen} />
      <Stack.Screen name="CreateWhistleblow" component={CreateWhistleblowScreen} />




      {/* Ideas & Resources */}
      <Stack.Screen name="Ideas" component={IdeasScreen} />
      <Stack.Screen name="IdeasComposer" component={IdeasComposerScreen} />
      <Stack.Screen name="ResourceSharing" component={ResourceSharingScreen} />
      <Stack.Screen name="CreateResource" component={CreateResourceScreen} />




      {/* Surveys */}
      <Stack.Screen name="Surveys" component={MemberSurveysScreen} />
      <Stack.Screen name="TakeSurvey" component={TakeSurveyScreen} />
      <Stack.Screen name="SubmitFeedback" component={SubmitFeedbackScreen} />




      {/* QnA */}
      <Stack.Screen name="QnASessions" component={QnASessionsScreen} />
      <Stack.Screen name="QnASessionDetail" component={QnASessionDetailScreen} />




      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




// MEMBER TAB NAVIGATOR (Bottom Tabs) - ✅ FIXED
function MemberTabNavigator() {
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
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={MemberHomeStack} />
      <Tab.Screen name="Bodies" component={MemberBodiesStack} />
      <Tab.Screen name="Cases" component={MemberCasesStack} />
      <Tab.Screen name="Inbox" component={MemberInboxStack} />
      <Tab.Screen name="Discover" component={MemberDiscoverStack} />
    </Tab.Navigator>
  );
}




// ✅ MEMBER CASES STACK
function MemberCasesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CasesMain" component={MyCasesScreen} />
      <Stack.Screen name="CreatePetitionType" component={CreatePetitionTypeScreen} />
      <Stack.Screen name="PetitionComposer" component={PetitionComposerScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




// ✅ MEMBER DRAWER NAVIGATOR (Wraps the Tabs)
function MemberDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '80%',
        },
      }}
    >
      <Drawer.Screen name="MainTabs" component={MemberTabNavigator} />
    </Drawer.Navigator>
  );
}




// ============================================================================
// BODY NAVIGATION - COMPLETE ✅ WITH IONICONS + 🆕 NEW CONTENT SCREENS
// ============================================================================
function BodyDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={BodyDashboardScreen} />
      {/* ✅ ADDED: Routes from dashboard */}
<Stack.Screen name="BodyPetitionsScreen" component={BodyPetitionsScreen} />
<Stack.Screen name="BodyPostsScreen" component={BodyPostsScreen} />
<Stack.Screen name="BodySettingsScreen" component={BodySettingsScreen} />
<Stack.Screen name="BodyAnalytics" component={BodyAnalyticsDashboardScreen} />
<Stack.Screen name="Team" component={BodyTeamScreen} />
      <Stack.Screen name="Analytics" component={BodyAnalyticsDashboardScreen} />
      <Stack.Screen name="AnalyticsGoals" component={AnalyticsGoalsScreen} />
      <Stack.Screen name="ImpactTracking" component={ImpactTrackingScreen} />
      <Stack.Screen name="PerformanceReports" component={PerformanceReportsScreen} />
      <Stack.Screen name="Petitions" component={BodyPetitionsScreen} />
      <Stack.Screen name="CreatePetition" component={CreatePetitionScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




function BodyContentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Posts" component={BodyPostsScreen} />
      <Stack.Screen name="CreatePost" component={CreateBodyPostScreen} />
      
      {/* 🆕 NEW CONTENT CREATION SCREENS */}
      <Stack.Screen name="CreateAnnouncementScreen" component={CreateAnnouncementScreen} />
      <Stack.Screen name="CreateProjectScreen" component={CreateProjectScreen} />
      <Stack.Screen name="CreateEventScreen" component={CreateEventScreen} />
      <Stack.Screen name="CreateDiscussionScreen" component={CreateDiscussionScreen} />
      
      {/* 🆕 NEW CONTENT DETAIL SCREENS */}
      <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="DiscussionDetail" component={DiscussionDetailScreen} />
      
      <Stack.Screen name="Surveys" component={MemberSurveysScreen} />
      <Stack.Screen name="TakeSurvey" component={TakeSurveyScreen} />
      <Stack.Screen name="QnASessions" component={QnASessionsScreen} />
      <Stack.Screen name="QnASessionDetail" component={QnASessionDetailScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




function BodyTeamStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeamMain" component={BodyTeamScreen} />
      <Stack.Screen name="ActivityLog" component={BodyActivityLogScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




function BodyPartnershipsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PartnershipsMain" component={BodyPartnershipsScreen} />
      <Stack.Screen name="CreatePartnership" component={CreatePartnershipScreen} />
      <Stack.Screen name="JointCampaigns" component={JointCampaignsScreen} />
      <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
      <Stack.Screen name="CreateProjectScreen" component={CreateProjectScreen} />
      <Stack.Screen name="CreateEventScreen" component={CreateEventScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




function BodySettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={BodySettingsScreen} />
      <Stack.Screen name="BodyMessages" component={BodyMessagesScreen} />
      <Stack.Screen name="ConversionHistory" component={ConversionHistoryScreen} />
      {SHARED_SCREENS.map((s) => (
        <Stack.Screen key={s.name} {...s} />
      ))}
    </Stack.Navigator>
  );
}




function BodyTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Content') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Team') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Partnerships') {
            iconName = focused ? 'link' : 'link-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={BodyDashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Content"
        component={BodyContentStack}
        options={{ tabBarLabel: 'Content' }}
      />
      <Tab.Screen
        name="Team"
        component={BodyTeamStack}
        options={{ tabBarLabel: 'Team' }}
      />
      <Tab.Screen
        name="Partnerships"
        component={BodyPartnershipsStack}
        options={{ tabBarLabel: 'Partnerships' }}
      />
      <Tab.Screen
        name="Settings"
        component={BodySettingsStack}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}




// ============================================================================
// LAWYER NAVIGATION - FIXED ✅ DISCOVER ICON & STACK UPDATED
// ============================================================================
function LawyerInboxStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InboxMain" component={InboxScreen} />
      <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <Stack.Screen name="ConversationDetail" component={ConversationDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}




function LawyerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Bodies') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Inbox') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'search' : 'search-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
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
        component={MemberHomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Bodies" 
        component={MemberBodiesStack}
        options={{ tabBarLabel: 'Bodies' }}
      />
      <Tab.Screen 
        name="Dashboard" 
        component={LawyerDashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Inbox" 
        component={LawyerInboxStack}
        options={{ tabBarLabel: 'Inbox' }}
      />
      <Tab.Screen 
        name="Discover" 
        component={MemberDiscoverStack}
        options={{ tabBarLabel: 'Discover' }}
      />
    </Tab.Navigator>
  );
}




// ✅ LAWYER DRAWER NAVIGATOR - HEADER HIDDEN
function LawyerDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '80%',
        },
      }}
    >
      <Drawer.Screen name="LawyerTabs" component={LawyerTabNavigator} />
    </Drawer.Navigator>
  );
}




// ============================================================================
// ADMIN NAVIGATION - COMPLETE ✅
// ============================================================================
function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Decisions') {
            iconName = focused ? 'scale' : 'scale-outline';
          } else if (route.name === 'Review') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F44336',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Decisions"
        component={AdminDecisionsScreen}
        options={{ tabBarLabel: 'Decisions' }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewDecisionScreen}
        options={{ tabBarLabel: 'Review' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsGoalsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen
        name="History"
        component={ConversionHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
    </Tab.Navigator>
  );
}




// ============================================================================
// ROOT NAVIGATOR - ✅ CLEAN VERSION
// ============================================================================
function RootNavigator() {
  const { user, userProfile, loading } = useAuth();
  const [forceShowApp, setForceShowApp] = useState(false);




  // ✅ FORCE TIMEOUT - Show app after 3 seconds no matter what
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('🚨 FORCING APP TO SHOW - Timeout reached');
      setForceShowApp(true);
    }, 3000);




    return () => clearTimeout(timeout);
  }, []);




  // Debug logs (keep for troubleshooting)
  if (__DEV__) {
    console.log('=== ROOT NAVIGATOR DEBUG ===');
    console.log('User ID:', user?.id);
    console.log('User Type:', userProfile?.userType);
    console.log('User Role:', userProfile?.role);
    console.log('Loading:', loading);
    console.log('Force Show:', forceShowApp);
    console.log('===========================');
  }




  // ✅ Show loading ONLY if still loading AND timeout hasn't passed
  if (loading && !forceShowApp) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F5F5',
        }}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading your profile...</Text>
      </View>
    );
  }




  if (!user) return <AuthStackNavigator />;




  // Determine navigation based on user type/role
  const userType = userProfile?.userType || userProfile?.role;




  switch (userType) {
    case 'body':
    case 'body_admin':
      return <BodyTabNavigator />;




    case 'lawyer':
      return <LawyerDrawerNavigator />;




    case 'admin':
      return <AdminTabNavigator />;




    case 'member':
    default:
      return <MemberDrawerNavigator />;
  }
}




const AppNavigator = () => {
  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};




export default AppNavigator;
