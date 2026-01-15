import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
    const { width, height } = useWindowDimensions();

    // Animation values for the dots
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;
    const dot4 = useRef(new Animated.Value(0)).current;

    // Fade in animation for the logo
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        try {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }).start();

            // Pulse animation for dots
            const animateDot = (dot: Animated.Value, delay: number) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(dot, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true,
                            delay: delay,
                        }),
                        Animated.timing(dot, {
                            toValue: 0.3, // Don't go to 0 opacity
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            };

            animateDot(dot1, 0);
            animateDot(dot2, 200);
            animateDot(dot3, 400);
            animateDot(dot4, 600);
        } catch (error) {
            // Animation error
        }
    }, []);

    const cardWidth = Math.min(width * 0.85, 360);
    const isTablet = width > 768;

    try {
        return (
            <View style={styles.container}>
                <LinearGradient
                    // Refined gradient from Top-Left (Blueish) to Bottom-Right (Pinkish/NavajoWhite)
                    colors={['#E6F0FF', '#F3E8FF', '#FAE8FF', '#FFF0F5', '#FFF7ED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={[
                        styles.card,
                        {
                            width: cardWidth,
                            minHeight: cardWidth * 1.1,
                            paddingHorizontal: isTablet ? 60 : 30,
                            paddingVertical: 50,
                        }
                    ]}>

                        <View style={styles.contentContainer}>
                            {/* Logo Section */}
                            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                                {/* Main Logo Image */}
                                <View style={styles.logoWrapper}>
                                    <Image
                                        source={require('./assets/logo.png')}
                                        style={styles.logo}
                                        resizeMode="contain"
                                    />
                                </View>

                                <Text style={styles.logoText}>DocLock</Text>
                            </Animated.View>

                            {/* Subtitle */}
                            <Text style={styles.subtitle}>Your secure digital sanctuary</Text>

                            {/* Loading Dots */}
                            <View style={styles.dotsWrapper}>
                                <View style={styles.dotsContainer}>
                                    {[dot1, dot2, dot3, dot4].map((dot, index) => (
                                        <Animated.View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                {
                                                    opacity: dot, // Directly map animated value to opacity
                                                    transform: [{
                                                        scale: dot.interpolate({
                                                            inputRange: [0.3, 1],
                                                            outputRange: [0.8, 1.2],
                                                        }),
                                                    }],
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Footer Text */}
                            <Text style={styles.footerText}>DECRYPTING VAULT...</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    } catch (error) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'red' }}>Splash Error: {(error as any)?.message}</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 36, // Slightly softer curve
        alignItems: 'center',
        justifyContent: 'center',
        // Elegant shadow
        shadowColor: '#6366F1', // Indigo shadow for depth
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12,
        shadowRadius: 35,
        elevation: 20,
        // Add a very subtle border for definition
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    contentContainer: {
        alignItems: 'center',
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoWrapper: {
        width: 140, // Increased size
        height: 140,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
        zIndex: 2,
    },
    logoGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        backgroundColor: '#60A5FA', // Blue glow
        borderRadius: 40,
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
        zIndex: 1,
    },
    logoText: {
        fontSize: 28,
        fontWeight: '800', // Extra bold
        color: '#0F172A', // Darker cleaner text
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15, // Slightly smaller
        color: '#64748B',  // Slate 500
        textAlign: 'center',
        marginBottom: 48,
        fontWeight: '500',
        lineHeight: 22,
    },
    dotsWrapper: {
        height: 20,
        justifyContent: 'center',
        marginBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 10, // Increased gap slightly
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#C084FC', // Purple shade (Violet 400)
    },
    footerText: {
        fontSize: 11,
        color: '#A855F7', // Purple 500
        letterSpacing: 2,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
