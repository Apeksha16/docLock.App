import { useRef } from 'react';
import { Animated, PanResponder, Platform } from 'react-native';

interface SwipeGestureConfig {
  onSwipeBack: () => void;
  enabled?: boolean;
  threshold?: number;
}

export const useSwipeGesture = ({ onSwipeBack, enabled = true, threshold = 50 }: SwipeGestureConfig) => {
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        if (!enabled) return false;
        
        // Only activate if swipe starts from the left edge (iOS style)
        // or from either edge (Android style)
        const { locationX } = evt.nativeEvent;
        const screenWidth = gestureState.dx;
        
        if (Platform.OS === 'ios') {
          // iOS: Only from left edge (within 20px)
          return locationX < 20;
        } else {
          // Android: From left or right edge (within 20px)
          return locationX < 20 || locationX > (gestureState.dx - 20);
        }
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!enabled) return false;
        
        // Activate if horizontal swipe is detected
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderGrant: () => {
        pan.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow right swipe (positive dx) for back gesture
        if (gestureState.dx > 0) {
          pan.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > threshold && gestureState.vx > 0) {
          // Swipe was far enough and in the right direction
          Animated.timing(pan, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeBack();
            pan.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Snap back if gesture is interrupted
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return {
    panResponder,
    pan,
  };
};
