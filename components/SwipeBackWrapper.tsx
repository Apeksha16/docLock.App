import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface SwipeBackWrapperProps {
  children: React.ReactNode;
  onSwipeBack: () => void;
  enabled?: boolean;
}

const SwipeBackWrapper: React.FC<SwipeBackWrapperProps> = ({ 
  children, 
  onSwipeBack, 
  enabled = true 
}) => {
  const { panResponder, pan } = useSwipeGesture({
    onSwipeBack,
    enabled,
    threshold: 100, // Swipe at least 100px to trigger back
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              {
                translateX: pan.interpolate({
                  inputRange: [0, 300],
                  outputRange: [0, 300],
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: pan.interpolate({
              inputRange: [0, 150, 300],
              outputRange: [1, 0.8, 0.5],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SwipeBackWrapper;
