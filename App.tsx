import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { app } from './firebaseConfig';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';
import { notificationService } from './services/notificationService';
import { User } from 'firebase/auth';
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import OtpVerificationScreen from './OtpVerificationScreen';
import DashboardScreen from './DashboardScreen';
import NotificationScreen from './NotificationScreen';
import FriendsScreen from './FriendsScreen';
import ProfileScreen from './ProfileScreen';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';

// Ignore specific warnings from third-party libraries that we cannot fix directly
LogBox.ignoreLogs([
  'FirebaseRecaptcha: Support for defaultProps will be removed',
  'componentWillReceiveProps has been renamed',
]);

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
  const [verificationId, setVerificationId] = useState('');
  const [fullName, setFullName] = useState('');
  const [cardToEdit, setCardToEdit] = useState<any>(null); // For editing cards

  // Data State
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<any>(null);

  const profileUnsubRef = useRef<(() => void) | null>(null);
  const notifsUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = authService.subscribeToAuthChanges(async (currentUser) => {
      // 1. Cleanup previous subscriptions
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
      if (notifsUnsubRef.current) {
        notifsUnsubRef.current();
        notifsUnsubRef.current = null;
      }

      setUser(currentUser);

      if (currentUser) {
        // 2. Fetch App Config (Once)
        const config = await firestoreService.getAppConfig();
        setAppConfig(config);

        // 3. Subscribe to Profile
        profileUnsubRef.current = firestoreService.subscribeToUserProfile(currentUser.uid, (data) => {
          setUserProfile(data);
        });

        // 4. Subscribe to Notifications
        notifsUnsubRef.current = notificationService.subscribeToNotifications(currentUser.uid, (notifs) => {
          setNotifications(notifs);
        });
      } else {
        // User logged out
        setUserProfile(null);
        setNotifications([]);
        setAppConfig(null);
        setCurrentScreen('login');
      }
    });

    // Splash Timer
    const timer = setTimeout(() => {
      setShowSplash(false);
      // If user is already logged in, go to Dashboard, else Login
      // We'll let the initial render decide, or update logic here:
      if (authService.getCurrentUser()) {
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('login');
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      unsubscribeAuth();
    };
  }, []);

  const handleNavigate = (screen: 'splash' | 'login' | 'signup' | 'otp' | 'dashboard' | 'notifications' | 'friends' | 'profile' | 'secure-qr' | 'my-cards' | 'add-card' | 'my-documents' | 'about', params?: { mobile?: string, verificationId?: string, fullName?: string, cardData?: any }) => {
    if (params?.mobile) {
      setMobileNumber(params.mobile);
    }
    if (params?.verificationId) {
      setVerificationId(params.verificationId);
    }
    if (params?.fullName) {
      setFullName(params.fullName);
    }
    // Set or Clear cardToEdit based on presence of cardData
    if (params?.cardData) {
      setCardToEdit(params.cardData);
    } else if (screen === 'add-card' && !params?.cardData) {
      // Clearing logic: if going to add-card without data, it's a new add.
      // But if navigating away, we might want to clear it too?
      // Simpler: clear it if not provided when navigating to add-card.
      setCardToEdit(null);
    } else {
      // For other screens, maybe clear it? Not strictly necessary unless we reuse add-card.
    }

    setCurrentScreen(screen);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onNavigate={(screen, mobile, verificationId) => handleNavigate(screen, { mobile, verificationId })} />;
      case 'signup':
        // Pass mobile number if available (from Login redirect)
        return <SignupScreen mobileNumber={mobileNumber} onNavigate={(screen, mobile, verificationId, fullName) => handleNavigate(screen, { mobile, verificationId, fullName })} />;
      case 'otp':
        return <OtpVerificationScreen mobileNumber={mobileNumber} verificationId={verificationId} fullName={fullName} onNavigate={(screen) => handleNavigate(screen)} />;
      case 'dashboard':
        return <DashboardScreen
          userProfile={userProfile}
          notifications={notifications}
          appConfig={appConfig}
          onNavigate={(screen) => handleNavigate(screen)}
        />;
      case 'notifications':
        return <NotificationScreen
          onNavigate={() => handleNavigate('dashboard')}
          notifications={notifications}
          userId={user?.uid}
        />;
      case 'friends':
        return <FriendsScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid} />;
      case 'profile':
        return <ProfileScreen
          userProfile={userProfile}
          appConfig={appConfig}
          userId={user?.uid}
          onNavigate={(screen) => handleNavigate(screen)}
        />;
      case 'secure-qr':
        return <SecureQRScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid} />;
      case 'my-cards':
        return <MyCardsScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid || ''} />;
      case 'add-card':
        return <AddCardScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid || ''} cardToEdit={cardToEdit} />;
      case 'my-documents':
        return <MyDocumentsScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid} />;
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
