import { Platform, ToastAndroid, Alert } from 'react-native';
import * as Device from 'expo-device';

// Enable debug mode - set to true to show toasts, false to disable
export const DEBUG_MODE = __DEV__ || true; // Always enable in production for now

class DebugLogger {
  private logs: string[] = [];
  private maxLogs = 100;

  log(message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
    
    // Console log
    console.log(logMessage);
    
    // Store in memory
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Show toast on Android
    if (DEBUG_MODE && Platform.OS === 'android') {
      try {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } catch (error) {
        console.error('Toast error:', error);
      }
    }
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toLocaleTimeString();
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const logMessage = `[${timestamp}] ERROR: ${message} - ${errorMessage}`;
    
    // Console error
    console.error(logMessage, error);
    
    // Store in memory
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Show toast on Android
    if (DEBUG_MODE && Platform.OS === 'android') {
      try {
        ToastAndroid.show(`ERROR: ${message}`, ToastAndroid.LONG);
      } catch (err) {
        console.error('Toast error:', err);
      }
    }

    // Show alert on iOS or if toast fails
    if (Platform.OS === 'ios' || (Platform.OS === 'android' && !Device.isDevice)) {
      Alert.alert('Debug Error', `${message}\n\n${errorMessage}`);
    }
  }

  warn(message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] WARN: ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
    
    console.warn(logMessage);
    
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (DEBUG_MODE && Platform.OS === 'android') {
      try {
        ToastAndroid.show(`WARN: ${message}`, ToastAndroid.SHORT);
      } catch (error) {
        console.error('Toast error:', error);
      }
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const debugLogger = new DebugLogger();

// Convenience functions
export const log = (message: string, data?: any) => debugLogger.log(message, data);
export const logError = (message: string, error?: any) => debugLogger.error(message, error);
export const logWarn = (message: string, data?: any) => debugLogger.warn(message, data);
