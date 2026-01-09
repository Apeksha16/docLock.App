import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    Pressable,
    Keyboard
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Props for navigation callback
interface OtpVerificationScreenProps {
    mobileNumber: string;
    onNavigate: (screen: 'dashboard') => void;
}

export default function OtpVerificationScreen({ mobileNumber, onNavigate }: OtpVerificationScreenProps) {
    // ... existing hooks ...
    const { width } = useWindowDimensions();
    const isTablet = width > 768;
    const cardWidth = isTablet ? 450 : width;

    // OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputs = useRef<Array<TextInput | null>>([]);
    const [timer, setTimer] = useState(30);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // OTP Input Handler
    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onNavigate('dashboard');
        }, 1500);
    };

    return (
        <View style={[
            styles.container,
            { justifyContent: isTablet ? 'center' : 'flex-end' }
        ]}>
            {/* Background */}
            <LinearGradient
                colors={['#1e1b4b', '#312e81', '#1e1b4b']}
                style={styles.background}
            />

            {/* Main Card */}
            <View style={[
                styles.card,
                {
                    width: cardWidth,
                    padding: isTablet ? 50 : 30,
                    // Remove bottom border radius on mobile
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    borderBottomLeftRadius: isTablet ? 30 : 0,
                    borderBottomRightRadius: isTablet ? 30 : 0,
                    paddingBottom: isTablet ? 50 : 50, // More padding at bottom
                }
            ]}>
                {/* Drag Handle */}
                <View style={styles.dragger} />

                {/* Lock Icon */}
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={32} color="#8B5CF6" />
                </View>

                {/* Title */}
                <Text style={styles.title}>Verify it's you</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to {'\n'}
                    <Text style={styles.boldText}>******{mobileNumber.slice(-4)}</Text>
                </Text>

                {/* OTP Inputs */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                (focusedIndex === index || digit) && styles.otpInputFocused
                            ]}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            onFocus={() => setFocusedIndex(index)}
                            onBlur={() => setFocusedIndex(null)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {/* Resend Timer */}
                <Text style={styles.resendText}>
                    Resend code in <Text style={styles.timerText}>{timer}s</Text>
                </Text>

                {/* Verify Button */}
                <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={handleVerify}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Text style={styles.verifyButtonText}>Verifying...</Text>
                    ) : (
                        <Text style={styles.verifyButtonText}>Verify</Text>
                    )}
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E1B4B',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    dragger: {
        width: 40,
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        marginBottom: 30,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3E8FF', // Light purple
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    boldText: {
        fontWeight: '700',
        color: '#0F172A',
    },
    otpContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 40,
        width: '100%',
        justifyContent: 'center',
    },
    otpInput: {
        width: 45,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600',
        color: '#0F172A',
    },
    otpInputFocused: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FFFFFF',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    resendText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    timerText: {
        color: '#8B5CF6',
        fontWeight: '700',
    },
    verifyButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#8B5CF6',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
