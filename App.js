import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AuthScreen from './app/screens/AuthScreen';
import MemberHomeScreen from './app/screens/MemberHomeScreen';
import { supabase } from './supabase';
import { NetworkMonitor } from './utils/networkMonitor';
import { PushNotificationService } from './utils/pushNotificationService';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const notificationListener = useRef();
  const responseListener = useRef();
  const networkUnsubscribe = useRef();

  useEffect(() => {
    initializeApp();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupNotificationListeners();
      if (networkUnsubscribe.current) {
        networkUnsubscribe.current();
      }
    };
  }, []);

  const initializeApp = async () => {
    networkUnsubscribe.current = NetworkMonitor.initialize((isConnected, type) => {
      console.log('Network changed:', isConnected, type);
    });

    notificationListener.current = PushNotificationService.addNotificationListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = PushNotificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        if (data.petitionId) {
          console.log('Navigate to petition:', data.petitionId);
        }
      }
    );
  };

  const cleanupNotificationListeners = () => {
    if (notificationListener.current && responseListener.current) {
      PushNotificationService.removeNotificationListeners([
        notificationListener.current,
        responseListener.current,
      ]);
    }
  };

  const loadUserProfile = async (user) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      
      const pushToken = await PushNotificationService.registerForPushNotifications();
      if (pushToken) {
        await PushNotificationService.savePushToken(user.id, pushToken);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <MemberHomeScreen
      user={session.user}
      profile={profile}
      onLogout={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});
