import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function OnboardingScreen({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: '🏛️',
      title: 'Empower Your Voice',
      description: 'Empowering citizens, local bodies, and legal advocates to foster transparent governance.',
      tagline: 'Join as a Member',
      buttonText: 'Join as a Member',
      buttonColor: '#0066FF',
    },
    {
      icon: '🏢',
      title: 'Organizations Unite',
      description: 'Local bodies can create, govern, and manage community initiatives.',
      tagline: 'Create a Body',
      buttonText: 'Create a Body',
      buttonColor: '#34C759',
    },
    {
      icon: '⚖️',
      title: 'Legal Support',
      description: 'Lawyers can provide legal aid and verify petitions for authenticity.',
      tagline: 'Lawyer Signup',
      buttonText: 'Lawyer Signup',
      buttonColor: '#AF52DE',
    },
  ];

  const currentSlide = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{currentSlide.icon}</Text>
        </View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentStep === index && styles.dotActive
            ]}
          />
        ))}
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.tagline}>{currentSlide.tagline}</Text>
        
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: currentSlide.buttonColor }]}
          onPress={handleNext}
        >
          <Text style={styles.mainButtonText}>{currentSlide.buttonText}</Text>
        </TouchableOpacity>

        {currentStep === 0 && (
          <>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: '#34C759' }]}
              onPress={() => setCurrentStep(1)}
            >
              <Text style={[styles.secondaryButtonText, { color: '#34C759' }]}>
                Create a Body
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: '#AF52DE' }]}
              onPress={() => setCurrentStep(2)}
            >
              <Text style={[styles.secondaryButtonText, { color: '#AF52DE' }]}>
                Lawyer Signup
              </Text>
            </TouchableOpacity>
          </>
        )}

        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setCurrentStep(0)}
          >
            <Text style={styles.skipButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your privacy and security are our priority.
          </Text>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Sign up and create your profile</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Create or support petitions</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Engage with local bodies</Text>
          </View>
        </View>
      </View>

      {/* Explore Link */}
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={onComplete}
      >
        <Text style={styles.exploreIcon}>⏭</Text>
        <Text style={styles.exploreText}>Explore Anonymously</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#0066FF',
    width: 24,
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  tagline: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  mainButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  securityNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  howItWorks: {
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
  },
  exploreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  exploreIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  exploreText: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '600',
  },
});
