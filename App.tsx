import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { app } from './firebaseConfig';

export default function App() {
  const [firebaseStatus, setFirebaseStatus] = useState('Initializing...');

  useEffect(() => {
    try {
      if (app) {
        setFirebaseStatus('Firebase Connected ✅');
      }
    } catch (error) {
      setFirebaseStatus('Firebase Error ❌');
      console.error(error);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>docLock</Text>
          <Text style={styles.subtitle}>Secure Your Documents</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{firebaseStatus}</Text>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep blue slate
  },
  header: {
    paddingTop: 100,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 40,
  },
  statusText: {
    color: '#38BDF8',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
