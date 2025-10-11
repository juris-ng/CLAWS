import { Animated, Easing } from 'react-native';

export const AnimationUtils = {
  // Fade in animation
  fadeIn: (animatedValue, duration = 300) => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  },

  // Fade out animation
  fadeOut: (animatedValue, duration = 300) => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  },

  // Slide up animation
  slideUp: (animatedValue, duration = 300) => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  },

  // Scale animation
  scale: (animatedValue, toValue = 1, duration = 200) => {
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  },

  // Bounce animation
  bounce: (animatedValue) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  },

  // Shake animation
  shake: (animatedValue) => {
    Animated.sequence([
      Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  },

  // Pull to refresh animation
  createPullToRefreshAnimation: () => {
    const scrollY = new Animated.Value(0);
    return scrollY;
  },
};
