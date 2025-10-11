import { Easing, Platform } from 'react-native';

export const navigationAnimations = {
  // iOS-style slide from right
  slideFromRight: {
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, next, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
            {
              scale: next
                ? next.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.9],
                  })
                : 1,
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  },

  // Android-style fade
  fade: {
    gestureEnabled: false,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.ease,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.ease,
        },
      },
    },
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
  },

  // Modal from bottom (Instagram/WhatsApp style)
  modalFromBottom: {
    gestureEnabled: true,
    gestureDirection: 'vertical',
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 250,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  },

  // Zoom effect
  zoom: {
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          opacity: current.progress,
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  },

  // Slide up (bottom sheet style)
  slideUp: {
    gestureEnabled: true,
    gestureDirection: 'vertical',
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          damping: 30,
          mass: 0.5,
          stiffness: 400,
        },
      },
      close: {
        animation: 'spring',
        config: {
          damping: 30,
          mass: 0.5,
          stiffness: 400,
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    }),
  },

  // Get platform default animation
  platformDefault: Platform.select({
    ios: 'slideFromRight',
    android: 'fade',
  }),

  // Shared element transition config
  sharedElement: {
    gestureEnabled: false,
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          damping: 25,
          mass: 1,
          stiffness: 250,
        },
      },
      close: {
        animation: 'spring',
        config: {
          damping: 25,
          mass: 1,
          stiffness: 250,
        },
      },
    },
  },

  // No animation
  none: {
    transitionSpec: {
      open: { animation: 'timing', config: { duration: 0 } },
      close: { animation: 'timing', config: { duration: 0 } },
    },
    cardStyleInterpolator: () => ({}),
  },
};

// Export individual animations
export const {
  slideFromRight,
  fade,
  modalFromBottom,
  zoom,
  slideUp,
  platformDefault,
  sharedElement,
  none,
} = navigationAnimations;

// Helper function to get animation by name
export const getAnimation = (name) => {
  return navigationAnimations[name] || navigationAnimations.platformDefault;
};
