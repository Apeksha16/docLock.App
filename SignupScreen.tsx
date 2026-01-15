import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    Image,
    Pressable,
    Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';

// Props for navigation callback
interface SignupScreenProps {
    onNavigate: (screen: 'login' | 'otp', mobile?: string, verificationId?: string, fullName?: string) => void;
    mobileNumber?: string;
}

export default function SignupScreen({ onNavigate, mobileNumber: prefilledMobile }: SignupScreenProps) {
    const { width } = useWindowDimensions();
    const isTablet = width > 768;
    const cardWidth = isTablet ? 450 : width;

    const [isHovered, setIsHovered] = useState(false);
    const [isNameFocused, setIsNameFocused] = useState(false);
    const [isMobileFocused, setIsMobileFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');

    useEffect(() => {
        if (prefilledMobile) {
            setMobileNumber(prefilledMobile);
        }
    }, [prefilledMobile]);

    // Validation
    const isValidMobile = /^[6-9][0-9]{9}$/.test(mobileNumber);
    const isValidName = fullName.trim().length > 0 && /^[a-zA-Z\s]*$/.test(fullName);
    const isValid = isValidMobile && isValidName;

    const handleSendOtp = async () => {
        if (!isValid) return;

        setIsLoading(true);
        try {
            // 1. Check if user ALREADY exists
            let userExists = false;
            try {
                userExists = await firestoreService.checkUserExistsByMobile(mobileNumber);
            } catch (error: any) {
                if (error.message.includes("Missing or insufficient permissions") || error.code === 'permission-denied') {
                    Alert.alert(
                        "Setup Required",
                        "Firestore Security Rules are blocking this request. \n\nPlease go to Firebase Console > Firestore > Rules and allow 'read' access to the 'users' collection."
                    );
                    setIsLoading(false);
                    return;
                }
                throw error;
            }

            if (userExists) {
                // User exists -> Redirect to Login
                setIsLoading(false);
                Alert.alert(
                    "User Exists",
                    "An account with this mobile number already exists. Please sign in.",
                    [
                        {
                            text: "Go to Login",
                            onPress: () => onNavigate('login', mobileNumber)
                        },
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ]
                );
                return;
            }

            // 2. User New -> Proceed to Signup OTP
            const phoneNumber = `+91${mobileNumber}`;

            // React Native Firebase Auth uses native phone auth - no reCAPTCHA verifier needed
            const verificationId = await authService.sendOtp(phoneNumber);

            onNavigate('otp', mobileNumber, verificationId || undefined, fullName);
        } catch (error: any) {
            Alert.alert("Signup Failed", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameChange = (text: string) => {
        if (/^[a-zA-Z\s]*$/.test(text)) {
            setFullName(text);
        }
    };

    const handleMobileChange = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        if (numericValue.length <= 10) {
            setMobileNumber(numericValue);
        }
    };

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

            {/* ... Rest of UI ... */}
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
                        value={fullName}
                        onChangeText={handleNameChange}
                        onFocus={() => setIsNameFocused(true)}
                        onBlur={() => setIsNameFocused(false)}
                        editable={!isLoading}
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
                        value={mobileNumber}
                        onChangeText={handleMobileChange}
                        maxLength={10}
                        onFocus={() => setIsMobileFocused(true)}
                        onBlur={() => setIsMobileFocused(false)}
                        editable={!isLoading}
                    />
                </View>

                {/* CTA Button */}
                <Pressable
                    disabled={!isValid || isLoading}
                    onPressIn={() => setIsHovered(true)}
                    onPressOut={() => setIsHovered(false)}
                    onPress={handleSendOtp}
                    style={({ pressed }) => [
                        styles.button,
                        (!isValid || isLoading) && styles.buttonDisabled,
                        (pressed || isHovered) && isValid && !isLoading && styles.buttonPressed
                    ]}
                >
                    <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Get OTP'}</Text>
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

                {/* Version Number */}
                <Text style={styles.versionText}>
                    v{Constants.expoConfig?.version || '1.0.0'}
                </Text>

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
    buttonDisabled: {
        backgroundColor: '#C4B5FD',
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    versionText: {
        fontSize: 10,
        color: '#CBD5E1',
        marginTop: 16,
        fontWeight: '400',
        letterSpacing: 0.3,
    },
});
