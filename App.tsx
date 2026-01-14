import './crypto-polyfill';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';
import { notificationService } from './services/notificationService';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
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

LogBox.ignoreLogs([
  'componentWillReceiveProps has been renamed',
]);

import AboutScreen from './AboutScreen';
import SecurityPinModal from './components/SecurityPinModal';
import BottomNavBar from './components/BottomNavBar';

import SecureQRScreen from './SecureQRScreen';
import MyCardsScreen from './MyCardsScreen';
import AddCardScreen from './AddCardScreen';
import MyDocumentsScreen from './MyDocumentsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'signup' | 'otp' | 'dashboard' | 'notifications' | 'friends' | 'profile' | 'secure-qr' | 'my-cards' | 'add-card' | 'my-documents' | 'about'>('splash');
  const [showSplash, setShowSplash] = useState(true);
  const [mobileNumber, setMobileNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [fullName, setFullName] = useState('');
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<any>(null);

  const profileUnsubRef = useRef<(() => void) | null>(null);
  const notifsUnsubRef = useRef<(() => void) | null>(null);
  const cardsUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      const unsubscribeAuth = authService.subscribeToAuthChanges(async (currentUser) => {
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
      if (notifsUnsubRef.current) {
        notifsUnsubRef.current();
        notifsUnsubRef.current = null;
      }
      if (cardsUnsubRef.current) {
        cardsUnsubRef.current();
        cardsUnsubRef.current = null;
      }

      setUser(currentUser);

      if (currentUser) {
        firestoreService.getAppConfig().then((config) => {
          setAppConfig(config);
        }).catch((error) => {
          // Error fetching app config
        });

        try {
          profileUnsubRef.current = firestoreService.subscribeToUserProfile(currentUser.uid, (data) => {
            setUserProfile(data);
          });
        } catch (error) {
          // Error subscribing to profile
        }

        try {
          notifsUnsubRef.current = notificationService.subscribeToNotifications(currentUser.uid, (notifs) => {
            setNotifications(notifs);
          });
        } catch (error) {
          // Error subscribing to notifications
        }

        try {
          cardsUnsubRef.current = firestoreService.subscribeToCards(currentUser.uid, (data) => {
            setCards(data);
          });
        } catch (error) {
          // Error subscribing to cards
        }
      } else {
        setUserProfile(null);
        setNotifications([]);
        setCards([]);
        setAppConfig(null);
        setCurrentScreen('login');
      }
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
      
      try {
        const currentUser = authService.getCurrentUser();
        
        if (currentUser) {
          setCurrentScreen('dashboard');
        } else {
          setCurrentScreen('login');
        }
      } catch (error) {
        setCurrentScreen('login');
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      unsubscribeAuth();
    };
    } catch (error) {
      // Error in useEffect
    }
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
    if (params?.cardData) {
      setCardToEdit(params.cardData);
    } else if (screen === 'add-card' && !params?.cardData) {
      setCardToEdit(null);
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
        return <SignupScreen mobileNumber={mobileNumber} onNavigate={(screen, mobile, verificationId, fullName) => handleNavigate(screen, { mobile, verificationId, fullName })} />;
      case 'otp':
        return <OtpVerificationScreen mobileNumber={mobileNumber} verificationId={verificationId} fullName={fullName} onNavigate={(screen) => handleNavigate(screen)} />;
      case 'dashboard':
        return <DashboardScreen
          userProfile={userProfile}
          notifications={notifications}
          cards={cards}
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
        return <FriendsScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid} userProfile={userProfile} />;
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
        return <MyCardsScreen onNavigate={(screen, params) => handleNavigate(screen, params)} userId={user?.uid || ''} cards={cards} />;
      case 'add-card':
        return <AddCardScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid || ''} cardToEdit={cardToEdit} />;
      case 'my-documents':
        return <MyDocumentsScreen onNavigate={(screen) => handleNavigate(screen)} userId={user?.uid} />;
      case 'about':
        return <AboutScreen onNavigate={(screen) => handleNavigate(screen)} />;
      default:
        return null;
    }
  };

  const showBottomNav = ['dashboard', 'friends', 'profile'].includes(currentScreen);

  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.container}>
            <StatusBar style={currentScreen === 'dashboard' || currentScreen === 'notifications' ? "dark" : "light"} />
            {renderScreen()}
            {showBottomNav && (
              <BottomNavBar
                currentScreen={currentScreen}
                onNavigate={(screen) => handleNavigate(screen as any)}
              />
            )}
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white' }}>Error: {error?.message || 'Unknown error'}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
});
