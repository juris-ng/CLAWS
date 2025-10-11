import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';

// Import screens
import BodiesScreen from '../screens/BodiesScreen';
import BodyDashboardScreen from '../screens/BodyDashboardScreen';
import CasesScreen from '../screens/CasesScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import InboxScreen from '../screens/InboxScreen';
import LawyerDashboardScreen from '../screens/LawyerDashboardScreen';
import MemberHomeScreen from '../screens/MemberHomeScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator({ userType, user, profile }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0066FF',
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
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        children={() => {
          if (userType === 'body') {
            return <BodyDashboardScreen user={user} profile={profile} />;
          } else if (userType === 'lawyer') {
            return <LawyerDashboardScreen user={user} profile={profile} />;
          }
          return <MemberHomeScreen user={user} profile={profile} />;
        }}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      
      <Tab.Screen
        name="Bodies"
        children={() => <BodiesScreen user={user} profile={profile} />}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👥</Text>
          ),
        }}
      />
      
      <Tab.Screen
        name="Cases"
        children={() => <CasesScreen user={user} profile={profile} />}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>💼</Text>
          ),
        }}
      />
      
      <Tab.Screen
        name="Inbox"
        children={() => <InboxScreen user={user} profile={profile} />}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>✉️</Text>
          ),
          tabBarBadge: 3,
        }}
      />
      
      <Tab.Screen
        name="Discover"
        children={() => <DiscoverScreen user={user} profile={profile} />}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🔍</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
