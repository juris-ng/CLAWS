import { useState } from 'react';
import AdminHomeScreen from './AdminHomeScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ModerationScreen from './ModerationScreen';
import ReportsScreen from './ReportsScreen';
import UserManagementScreen from './UserManagementScreen';

export default function AdminNavigator({ user, profile, onBack }) {
  const [currentScreen, setCurrentScreen] = useState('Home');

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  const handleBackToHome = () => {
    setCurrentScreen('Home');
  };

  // Render current screen
  switch (currentScreen) {
    case 'Home':
      return (
        <AdminHomeScreen
          user={user}
          profile={profile}
          onBack={onBack}
          onNavigate={handleNavigate}
        />
      );
    
    case 'Users':
      return (
        <UserManagementScreen
          user={user}
          profile={profile}
          onBack={handleBackToHome}
        />
      );
    
    case 'Moderation':
      return (
        <ModerationScreen
          user={user}
          profile={profile}
          onBack={handleBackToHome}
        />
      );
    
    case 'Reports':
      return (
        <ReportsScreen
          user={user}
          profile={profile}
          onBack={handleBackToHome}
        />
      );
    
    case 'Analytics':
      return (
        <AnalyticsScreen
          user={user}
          profile={profile}
          onBack={handleBackToHome}
        />
      );
    
    default:
      return (
        <AdminHomeScreen
          user={user}
          profile={profile}
          onBack={onBack}
          onNavigate={handleNavigate}
        />
      );
  }
}
