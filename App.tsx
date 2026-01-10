import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { app } from './firebaseConfig';
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import OtpVerificationScreen from './OtpVerificationScreen';
import DashboardScreen from './DashboardScreen';
import NotificationScreen from './NotificationScreen';
import FriendsScreen from './FriendsScreen';
import ProfileScreen from './ProfileScreen';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AboutScreen from './AboutScreen';
import SecurityPinModal from './components/SecurityPinModal';

import SecureQRScreen from './SecureQRScreen';
import MyCardsScreen from './MyCardsScreen';
import AddCardScreen from './AddCardScreen';
import MyDocumentsScreen from './MyDocumentsScreen';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'signup' | 'otp' | 'dashboard' | 'notifications' | 'friends' | 'profile' | 'secure-qr' | 'my-cards' | 'add-card' | 'my-documents' | 'about'>('splash');
  const [showSplash, setShowSplash] = useState(true);
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      setCurrentScreen('login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (screen: 'splash' | 'login' | 'signup' | 'otp' | 'dashboard' | 'notifications' | 'friends' | 'profile' | 'secure-qr' | 'my-cards' | 'add-card' | 'my-documents' | 'about', params?: { mobile?: string }) => {
    if (params?.mobile) {
      setMobileNumber(params.mobile);
    }
    setCurrentScreen(screen);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onNavigate={(screen, mobile) => handleNavigate(screen, { mobile })} />;
      case 'signup':
        return <SignupScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'otp':
        return <OtpVerificationScreen mobileNumber={mobileNumber} onNavigate={(screen) => handleNavigate(screen)} />;
      case 'dashboard':
        return <DashboardScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'notifications':
        return <NotificationScreen onNavigate={() => handleNavigate('dashboard')} />;
      case 'friends':
        return <FriendsScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'profile':
        return <ProfileScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'secure-qr':
        return <SecureQRScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'my-cards':
        return <MyCardsScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'add-card':
        return <AddCardScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'my-documents':
        return <MyDocumentsScreen onNavigate={(screen) => handleNavigate(screen)} />;
      case 'about':
        return <AboutScreen onNavigate={(screen) => handleNavigate(screen)} />;
      default:
        return null; // Should not happen after splash
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style={currentScreen === 'dashboard' || currentScreen === 'notifications' ? "dark" : "light"} />
          {renderScreen()}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Match dark theme
  },
});
