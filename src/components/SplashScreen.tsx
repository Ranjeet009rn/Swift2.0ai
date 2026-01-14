import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spinnerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('Splash Screen mounted and starting animations');
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Circular loading spinner (faster like Skout)
    Animated.loop(
      Animated.timing(spinnerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();

    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spinnerRotation = spinnerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  console.log('Rendering SplashScreen component with blue background');

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(5, 48, 142, 0.83)' }]}>
      {/* Centered Spinner and Logo Container */}
      <View style={styles.spinnerContainer}>
        {/* Spinning Circle */}
        <Animated.View 
          style={[
            styles.spinner,
            {
              transform: [{ rotate: spinnerRotation }]
            }
          ]}
        />
        
        {/* Logo in Center */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/tally.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>
      
      {/* Text */}
      <Text style={styles.title}>SG Connect</Text>
      <Text style={styles.subtitle}>Loading...</Text>
      <Text style={styles.subtitle}>Co powered by SG Software Solutions</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(5, 48, 142, 0.83)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  spinnerContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  spinner: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  logoImage: {
    width: '80%',
    height: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    textAlign: 'center',
  },
});

export default SplashScreen;
