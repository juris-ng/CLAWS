import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const ResponsiveUtils = {
  // Device type detection
  isPhone: width < 768,
  isTablet: width >= 768 && width < 1024,
  isLargeTablet: width >= 1024,
  isSmallPhone: width < 375,
  
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,
  
  // Check if device is in landscape mode
  isLandscape: () => width > height,
  
  // Width percentage
  wp: (percentage) => {
    const value = (width * percentage) / 100;
    return Math.round(value);
  },
  
  // Height percentage
  hp: (percentage) => {
    const value = (height * percentage) / 100;
    return Math.round(value);
  },
  
  // Scale based on width
  scale: (size) => {
    const scale = width / guidelineBaseWidth;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },
  
  // Vertical scale based on height
  verticalScale: (size) => {
    const scale = height / guidelineBaseHeight;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },
  
  // Moderate scale (hybrid of scale and verticalScale)
  moderateScale: (size, factor = 0.5) => {
    const scale = width / guidelineBaseWidth;
    const newSize = size + (scale - 1) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },
  
  // Font scaling
  fontSize: (size) => {
    const scale = width / guidelineBaseWidth;
    const newSize = size * scale;
    if (Platform.OS === 'ios') {
      return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
      return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
  },
  
  // Spacing system
  spacing: (multiplier = 1) => {
    const baseSpacing = 8;
    return baseSpacing * multiplier;
  },
  
  // Card width calculator
  getCardWidth: (columns = 1, gap = 16) => {
    const totalGap = gap * (columns + 1);
    return (width - totalGap) / columns;
  },
  
  // Get number of columns based on screen size
  getListColumns: () => {
    if (width < 768) return 1; // Phone
    if (width < 1024) return 2; // Tablet
    return 3; // Large tablet/desktop
  },
  
  // Get grid columns for categories
  getCategoryColumns: () => {
    if (width < 375) return 2;
    if (width < 768) return 3;
    if (width < 1024) return 4;
    return 6;
  },
  
  // Safe area detection for iPhone X and newer
  isIPhoneX: () => {
    return (
      Platform.OS === 'ios' &&
      !Platform.isPad &&
      !Platform.isTVOS &&
      (height === 812 || 
       width === 812 || 
       height === 896 || 
       width === 896 ||
       height === 844 ||
       width === 844)
    );
  },
  
  // Safe area padding
  getSafeAreaPadding: () => {
    if (ResponsiveUtils.isIPhoneX()) {
      return {
        paddingTop: 44,
        paddingBottom: 34,
      };
    }
    return {
      paddingTop: Platform.OS === 'android' ? 24 : 20,
      paddingBottom: 0,
    };
  },
  
  // Get optimal image size
  getImageSize: (percentage = 100) => {
    const size = (width * percentage) / 100;
    return {
      width: Math.round(size),
      height: Math.round(size),
    };
  },
  
  // Breakpoints
  breakpoints: {
    xs: 0,
    sm: 375,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Check if screen matches breakpoint
  isBreakpoint: (breakpoint) => {
    const breakpointWidth = ResponsiveUtils.breakpoints[breakpoint];
    return width >= breakpointWidth;
  },
};

// Export individual functions for convenience
export const { 
  wp, 
  hp, 
  scale, 
  verticalScale, 
  moderateScale, 
  fontSize, 
  spacing 
} = ResponsiveUtils;
