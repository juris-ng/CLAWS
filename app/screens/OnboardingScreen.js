import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// CLAWS Brand Colors
const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  secondary: '#FF6B35',
  secondaryDark: '#E85A2A',
  secondaryLight: '#FFE5DC',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  white: '#FFFFFF',
  background: '#F8F9FA',
};

export default function OnboardingScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideContentFade = useRef(new Animated.Value(1)).current;
  const autoScrollTimer = useRef(null);

  const fullText = 'Voice Action Change';

  // 3 Slides: VOICE, ACTION, CHANGE - with colorful Ionicons
  const slides = [
    {
      id: 1,
      keyword: 'VOICE',
      icon: 'megaphone', // Ionicon name
      iconColor: COLORS.primary, // Blue
      title: 'Your Voice Matters',
      description: 'Speak up for what matters to your community. Every voice counts in building transparent governance.',
      color: COLORS.primary,
    },
    {
      id: 2,
      keyword: 'ACTION',
      icon: 'flash', // Ionicon name
      iconColor: COLORS.secondary, // Orange
      title: 'Take Action Now',
      description: 'Create petitions, support causes, and hold power accountable. Turn words into meaningful change.',
      color: COLORS.secondary,
    },
    {
      id: 3,
      keyword: 'CHANGE',
      icon: 'trending-up', // Ionicon name
      iconColor: COLORS.primary, // Blue
      title: 'Drive Real Change',
      description: 'Track progress, measure impact, and see your efforts create lasting transformation in governance.',
      color: COLORS.primary,
    },
  ];

  // Typing animation effect
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Function to start/restart auto-scroll timer
  const startAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }

    autoScrollTimer.current = setInterval(() => {
      Animated.timing(slideContentFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide((prevSlide) => {
          const nextSlide = (prevSlide + 1) % slides.length;
          
          scrollViewRef.current?.scrollTo({
            x: width * nextSlide,
            animated: false,
          });

          return nextSlide;
        });

        Animated.timing(slideContentFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
  };

  // Auto-scroll with timer reset on mount
  useEffect(() => {
    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, []);

  // Handle manual scroll
  const handleScroll = (event) => {
    const slideSize = width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    
    if (index !== currentSlide) {
      setCurrentSlide(index);
      startAutoScroll();
    }
  };

  // Handle manual scroll to slide (via dots)
  const scrollToSlide = (index) => {
    scrollViewRef.current?.scrollTo({ x: width * index, animated: true });
    setCurrentSlide(index);
    startAutoScroll();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.container}>
        {/* Logo & Wordmark Section */}
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <View style={styles.logoWrapper}>
            {/* CLAWS Logo Icon */}
            <Image
              source={require('../../assets/claws-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            
            {/* CLAWS Wordmark */}
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandText}>CLAWS</Text>
              {/* Typing animation tagline */}
              <Text style={styles.tagline}>
                {displayedText}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Carousel Section - Manual + Auto-scrolling */}
        <View style={styles.carouselSection}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            scrollEnabled={true}
            onScroll={handleScroll}
            contentContainerStyle={styles.scrollViewContent}
            style={{ opacity: slideContentFade }}
          >
            {slides.map((slide) => (
              <View key={slide.id} style={styles.slide}>
                {/* Keyword Badge */}
                <View style={[styles.keywordBadge, { backgroundColor: slide.color + '15' }]}>
                  <Text style={[styles.keywordText, { color: slide.color }]}>
                    {slide.keyword}
                  </Text>
                </View>

                {/* Large Icon Container with Ionicons */}
                <Animated.View style={[
                  styles.iconContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    }],
                  },
                ]}>
                  <View style={[styles.iconCircle, { 
                    backgroundColor: slide.color + '15',
                    borderColor: slide.color + '30',
                  }]}>
                    {/* Colorful Ionicon */}
                    <Ionicons 
                      name={slide.icon} 
                      size={100} 
                      color={slide.iconColor} 
                    />
                  </View>
                </Animated.View>

                {/* Text Content */}
                <View style={styles.textContent}>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <Text style={styles.slideDescription}>{slide.description}</Text>
                </View>
              </View>
            ))}
          </Animated.ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => scrollToSlide(index)}
                style={[
                  styles.dot,
                  currentSlide === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Bottom Section with Buttons */}
        <View style={styles.bottomSection}>
          {/* Create Account Button (Primary Blue) */}
          <TouchableOpacity
            style={[styles.createAccountButton, styles.buttonShadow]}
            onPress={() => navigation.navigate('MemberRegistration')}
            activeOpacity={0.8}
          >
            <Text style={styles.createAccountText}>Create account</Text>
          </TouchableOpacity>

          {/* Log In Button (Light Background) */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>

          {/* Additional Options - WITH IONICONS */}
          <View style={styles.additionalOptions}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => navigation.navigate('RegisterBody')}
            >
              <Ionicons name="business-outline" size={18} color={COLORS.mediumGray} style={styles.optionIconVector} />
              <Text style={styles.optionText}>Create a Body</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => navigation.navigate('RegisterLawyer')}
            >
              <Ionicons name="briefcase-outline" size={18} color={COLORS.mediumGray} style={styles.optionIconVector} />
              <Text style={styles.optionText}>Lawyer Signup</Text>
            </TouchableOpacity>
          </View>

          {/* Terms & Privacy Policy */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>By continuing, you agree to our </Text>
            <TouchableOpacity onPress={() => console.log('Terms')}>
              <Text style={styles.termsLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> and </Text>
            <TouchableOpacity onPress={() => console.log('Privacy')}>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Logo Section
  logoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.darkGray,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  cursor: {
    opacity: 0.7,
    fontWeight: '300',
  },

  // Carousel Section
  carouselSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  keywordBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  keywordText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },

  textContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 32,
    backgroundColor: COLORS.primary,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    paddingTop: 10,
  },
  createAccountButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  loginButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  // Additional Options
  additionalOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionIconVector: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  optionDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 4,
  },

  // Terms & Privacy
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  termsText: {
    fontSize: 11,
    color: COLORS.mediumGray,
  },
  termsLink: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
