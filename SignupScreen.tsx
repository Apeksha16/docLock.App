import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    Image,
    Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Props for navigation callback
interface SignupScreenProps {
    onNavigate: (screen: 'login') => void;
}

export default function SignupScreen({ onNavigate }: SignupScreenProps) {
    const { width } = useWindowDimensions();
    const isTablet = width > 768;
    // Mobile: Full width, Tablet: Restricted width
    const cardWidth = isTablet ? 450 : width;

    const [isHovered, setIsHovered] = useState(false);
    const [isNameFocused, setIsNameFocused] = useState(false);
    const [isMobileFocused, setIsMobileFocused] = useState(false);

    return (
        <View style={[
            styles.container,
            { justifyContent: isTablet ? 'center' : 'flex-end' }
        ]}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#1e1b4b', '#312e81', '#1e1b4b']}
                style={styles.background}
            />

            {/* Floating Circles */}
            <View style={[styles.circle, { top: -100, left: -50, width: 300, height: 300 }]} />
            <View style={[styles.circle, { bottom: -50, right: -100, width: 250, height: 250 }]} />

            {/* Main Card */}
            <View style={[
                styles.card,
                {
                    width: cardWidth,
                    paddingVertical: isTablet ? 60 : 40,
                    paddingHorizontal: isTablet ? 50 : 30,
                    // Remove bottom border radius on mobile
                    borderBottomLeftRadius: isTablet ? 30 : 0,
                    borderBottomRightRadius: isTablet ? 30 : 0,
                }
            ]}>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('./assets/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Headlines */}
                <Text style={styles.headLine}>Create Account</Text>
                <Text style={styles.subHeadLine}>Join DocLock today</Text>

                {/* Form Group: Full Name */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={[
                            styles.input,
                            isNameFocused && styles.inputFocused
                        ]}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94A3B8"
                        onFocus={() => setIsNameFocused(true)}
                        onBlur={() => setIsNameFocused(false)}
                    />
                </View>

                {/* Form Group: Mobile Number */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput
                        style={[
                            styles.input,
                            isMobileFocused && styles.inputFocused
                        ]}
                        placeholder="Enter 10-digit number"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        onFocus={() => setIsMobileFocused(true)}
                        onBlur={() => setIsMobileFocused(false)}
                    />
                </View>

                {/* CTA Button */}
                <Pressable
                    onPressIn={() => setIsHovered(true)}
                    onPressOut={() => setIsHovered(false)}
                    style={({ pressed }) => [
                        styles.button,
                        (pressed || isHovered) && styles.buttonPressed
                    ]}
                >
                    <Text style={styles.buttonText}>Get OTP</Text>
                </Pressable>

                {/* Footer Navigation */}
                <View style={styles.footerNav}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => onNavigate('login')}>
                        <Text style={styles.linkText}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                {/* Trust Badge */}
                <View style={styles.securityBadge}>
                    <MaterialCommunityIcons name="shield-check-outline" size={12} color="#94A3B8" />
                    <Text style={styles.securityText}>Your data is safe with us</Text>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#171717',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    circle: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 999,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 20,
    },
    logoContainer: {
        width: 100, // Increased size
        height: 100,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        zIndex: 2,
    },
    logoGlow: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#60A5FA',
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    headLine: {
        fontSize: 28, // Slightly Larger for Signup
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subHeadLine: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 32,
        fontWeight: '600',
    },
    formGroup: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1.5,
        borderColor: '#CBD5E1', // Slightly darker border for contrast
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
    },
    inputFocused: {
        borderColor: '#8B5CF6', // Vivid Purple
        backgroundColor: '#FFFFFF',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: '#8B5CF6', // Vivid Purple
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 24,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    buttonPressed: {
        backgroundColor: '#7C3AED',
        transform: [{ scale: 0.98 }],
        shadowOpacity: 0.2,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18, // Slightly bolder
    },
    footerNav: {
        flexDirection: 'row',
        marginBottom: 30,
        alignItems: 'center',
    },
    footerText: {
        color: '#64748B',
        fontSize: 15,
        fontWeight: '500',
    },
    linkText: {
        color: '#6366F1',
        fontWeight: '800',
        fontSize: 15,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 99,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    securityText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
