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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as Device from 'expo-device';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';
import { app } from './firebaseConfig';
import { Alert } from 'react-native';

// Props for navigation callback
interface LoginScreenProps {
    onNavigate: (screen: 'signup' | 'otp', mobile?: string, verificationId?: string) => void;
}

export default function LoginScreen({ onNavigate }: LoginScreenProps) {
    const { width } = useWindowDimensions();
    const isTablet = width > 768;
    // Mobile: Full width, Tablet: Restricted width
    const cardWidth = isTablet ? 450 : width;

    // Typewriter Effect Variables
    const words = ["STAY SECURE.", "ONE SCAN ACCESS.", "GO PAPERLESS."];
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    // Typewriter Logic
    React.useEffect(() => {
        if (index === words.length) return; // Should not happen with loop

        if (subIndex === words[index].length + 1 && !reverse) {
            // Finished typing word, wait before deleting
            const timeout = setTimeout(() => {
                setReverse(true);
            }, 2000); // Wait 2s
            return () => clearTimeout(timeout);
        }

        if (subIndex === 0 && reverse) {
            // Finished deleting, move to next word
            setReverse(false);
            setIndex((prev) => (prev + 1) % words.length);
            return;
        }

        // Typing/Deleting speed
        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? 50 : 150); // Faster delete, random typing

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse]);

    // Blink cursor
    React.useEffect(() => {
        const timeout2 = setInterval(() => {
            setBlink((prev) => !prev);
        }, 500);
        return () => clearInterval(timeout2);
    }, []);

    const [isHovered, setIsHovered] = useState(false);

    const [isFocused, setIsFocused] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');

    // Validation: 10 digits AND starts with 6, 7, 8, or 9
    const isValidMobile = /^[6-9][0-9]{9}$/.test(mobileNumber);

    // Handler to ensure only numbers are entered
    const handleTextChange = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        if (numericValue.length <= 10) {
            setMobileNumber(numericValue);
        }
    };

    const recaptchaVerifier = React.useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!isValidMobile) return;

        setIsLoading(true);
        try {
            // 1. Check if user exists in Firestore
            let userExists = false;
            try {
                userExists = await firestoreService.checkUserExistsByMobile(mobileNumber);
            } catch (error: any) {
                if (error.message.includes("Missing or insufficient permissions") || error.code === 'permission-denied') {
                    Alert.alert(
                        "Setup Required",
                        "Firestore Security Rules are blocking this request. \n\nPlease go to Firebase Console > Firestore > Rules and allow 'read' access to the 'users' collection for unauthenticated users (so we can check if you exist)."
                    );
                    setIsLoading(false);
                    return;
                }
                throw error;
            }

            if (!userExists) {
                // User does not exist -> Redirect to Signup
                setIsLoading(false);
                Alert.alert(
                    "New User",
                    "No existing account found with this mobile number. Please check your number or create an account.",
                    [
                        {
                            text: "Create Account",
                            onPress: () => onNavigate('signup', mobileNumber)
                        },
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ]
                );
                return;
            }

            // 2. User Exists -> Proceed to Login
            const phoneNumber = `+91${mobileNumber}`;

            // Pass undefined for verifier to use the Dummy Verifier in authService IF on Simulator.
            // On Real Device, pass the actual reCAPTCHA verifier.
            const verifier = (Device.isDevice && recaptchaVerifier.current) ? recaptchaVerifier.current : undefined;
            const verificationId = await authService.sendOtp(phoneNumber, verifier);
            onNavigate('otp', mobileNumber, verificationId);
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[
            styles.container,
            { justifyContent: isTablet ? 'center' : 'flex-end' }
        ]}>
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={app.options}
                attemptInvisibleVerification={false}
            />
            {/* Background Gradient similar to design (Dark Blue/indigo) */}
            <LinearGradient
                colors={['#1e1b4b', '#312e81', '#1e1b4b']} // Deep indigo/slate
                style={styles.background}
            />

            {/* Floating Circles for ambiance (optional, can be removed if strictly flat) */}
            <View style={[styles.circle, { top: -100, right: -50, width: 300, height: 300 }]} />
            <View style={[styles.circle, { bottom: -50, left: -100, width: 200, height: 200 }]} />

            {/* Main Card */}
            <View style={[
                styles.card,
                {
                    width: cardWidth,
                    paddingVertical: isTablet ? 60 : 40,
                    paddingHorizontal: isTablet ? 50 : 30,
                    // Remove bottom border radius on mobile for "Bottom Sheet" look
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
                <Text style={styles.headLine}>
                    {`${words[index].substring(0, subIndex)}${blink ? '|' : ' '}`}
                </Text>
                <Text style={styles.subHeadLine}>Sign in to your secure vault</Text>

                {/* Form Group */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput
                        style={[
                            styles.input,
                            isFocused && styles.inputFocused
                        ]}
                        placeholder="Enter 10-digit number"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        value={mobileNumber}
                        onChangeText={handleTextChange}
                        maxLength={10}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        editable={!isLoading}
                    />
                </View>

                {/* CTA Button */}
                <Pressable
                    disabled={!isValidMobile || isLoading}
                    onPressIn={() => setIsHovered(true)}
                    onPressOut={() => setIsHovered(false)}
                    onPress={handleSendOtp}
                    style={({ pressed }) => [
                        styles.button,
                        (!isValidMobile || isLoading) && styles.buttonDisabled,
                        (pressed || isHovered) && isValidMobile && !isLoading && styles.buttonPressed
                    ]}
                >
                    <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Get OTP'}</Text>
                </Pressable>

                {/* Footer Navigation */}
                <View style={styles.footerNav}>
                    <Text style={styles.footerText}>New to DocLock? </Text>
                    <TouchableOpacity onPress={() => onNavigate('signup')}>
                        <Text style={styles.linkText}>Create Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Security Badge */}
                <View style={styles.securityBadge}>
                    <MaterialCommunityIcons name="lock" size={12} color="#94A3B8" />
                    <Text style={styles.securityText}>Secured with 256-bit encryption</Text>
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
        backgroundColor: '#171717', // Fallback
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
        borderRadius: 30, // Soft large radius
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
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subHeadLine: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 40,
        fontWeight: '500',
    },
    formGroup: {
        width: '100%',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
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
        marginBottom: 24,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
        transform: [{ scale: 1 }],
    },
    buttonPressed: {
        backgroundColor: '#7C3AED',
        transform: [{ scale: 0.98 }], // Press/Hover effect
        shadowOpacity: 0.2,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    footerNav: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
    },
    linkText: {
        color: '#6366F1', // Indigo
        fontWeight: '700',
        fontSize: 14,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 99,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    securityText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    buttonDisabled: {
        backgroundColor: '#C4B5FD', // Light, washed-out purple
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
});
