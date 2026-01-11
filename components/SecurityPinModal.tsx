import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, useWindowDimensions, Alert, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { cryptoService } from '../services/cryptoService';
import { firestoreService } from '../services/firestoreService';
import { notificationService } from '../services/notificationService';

interface SecurityPinModalProps {
    visible: boolean;
    onClose: () => void;
    userId?: string;
    mode?: 'set' | 'verify'; // Default to 'set' if not provided (but logic will adapt)
    storedMpin?: string; // Encrypted/Hashed MPIN for verification
    onSuccess?: () => void; // Callback on successful set or verify
}

export default function SecurityPinModal({ visible, onClose, userId, mode = 'set', storedMpin, onSuccess }: SecurityPinModalProps) {
    const [pin, setPin] = useState<string[]>([]);
    const [step, setStep] = useState<'create' | 'confirm' | 'verify'>('create');
    const [firstPin, setFirstPin] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { height: screenHeight } = useWindowDimensions();

    const handlePress = (value: string) => {
        if (pin.length < 4 && !isLoading) {
            setPin([...pin, value]);
        }
    };

    const handleBackspace = () => {
        if (!isLoading) {
            setPin(pin.slice(0, -1));
        }
    };

    const handleReset = () => {
        if (!isLoading) {
            setPin([]);
            if (mode === 'verify') {
                setStep('verify');
            } else {
                setStep('create');
            }
            setFirstPin([]);
        }
    };

    useEffect(() => {
        if (pin.length === 4) {
            handlePinComplete();
        }
    }, [pin]);

    const handlePinComplete = async () => {
        const enteredPin = pin.join('');

        if (step === 'verify') {
            await verifyPin(enteredPin);
        } else if (step === 'create') {
            // Move to confirm
            setTimeout(() => {
                setFirstPin(pin);
                setPin([]);
                setStep('confirm');
            }, 300);
        } else if (step === 'confirm') {
            // Check match
            if (enteredPin === firstPin.join('')) {
                await setPinInFirestore(enteredPin);
            } else {
                Alert.alert('Mismatch', 'PINs do not match. Please try again.');
                setPin([]);
                setStep('create');
                setFirstPin([]);
            }
        }
    };

    const setPinInFirestore = async (newPin: string) => {
        try {
            if (!userId) {
                Alert.alert('Error', 'User ID missing.');
                handleReset();
                return;
            }
            setIsLoading(true);
            const hashedPin = cryptoService.hashMpin(newPin, userId);
            // Save to Firestore
            await firestoreService.updateUserMpin(userId, hashedPin);

            // Trigger Notification
            await notificationService.sendNotification(userId, {
                title: 'Security Update',
                description: 'Your MPIN has been updated successfully.',
                type: 'security'
            });

            Alert.alert('Success', 'Your MPIN has been set securely.');

            setIsLoading(false);

            setTimeout(() => {
                onSuccess?.();
                onClose();
                handleReset(); // Reset internal state for next open
            }, 300);

        } catch (error: any) {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to set PIN. ' + error.message);
            handleReset();
        }
    };

    const verifyPin = async (inputPin: string) => {
        setIsLoading(true);
        // Emulate network delay / processing
        setTimeout(() => {
            setIsLoading(false);

            if (!userId || !storedMpin) {
                Alert.alert('Error', 'Verification data missing.');
                handleReset();
                return;
            }

            const isValid = cryptoService.verifyMpin(inputPin, storedMpin, userId);

            if (isValid) {
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                    handleReset();
                }, 100);
            } else {
                Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect.');
                setPin([]);
            }
        }, 500);
    };

    // Initialize intent
    useEffect(() => {
        if (visible) {
            setPin([]);
            setFirstPin([]);
            if (mode === 'verify') {
                setStep('verify');
            } else {
                setStep('create');
            }
        }
    }, [visible, mode]);

    const renderDot = (index: number) => {
        const isFilled = index < pin.length;
        return (
            <View
                key={index}
                style={[
                    styles.dot,
                    isFilled && styles.dotFilled
                ]}
            />
        );
    };

    const getTitle = () => {
        if (step === 'verify') return 'Enter PIN';
        if (step === 'create') return 'Create PIN';
        return 'Confirm PIN';
    };

    const getSubtitle = () => {
        if (step === 'verify') return 'Enter your 4-digit security PIN';
        if (step === 'create') return 'Create a 4-digit PIN';
        return 'Re-enter to confirm';
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Close by tapping overlay */}
                <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />

                <View style={[styles.modalContent, { height: screenHeight * 0.85 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="chevron-down" size={32} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>{getTitle()}</Text>
                        <Text style={styles.subtitle}>{getSubtitle()}</Text>

                        {/* PIN Dots */}
                        <View style={styles.dotsContainer}>
                            {[0, 1, 2, 3].map(renderDot)}
                        </View>

                        {isLoading && (
                            <ActivityIndicator size="large" color="#0F172A" style={{ marginBottom: 20 }} />
                        )}

                        {/* Keypad */}
                        <View style={styles.keypad}>
                            <View style={styles.row}>
                                {[1, 2, 3].map((num) => (
                                    <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num.toString())} disabled={isLoading}>
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.row}>
                                {[4, 5, 6].map((num) => (
                                    <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num.toString())} disabled={isLoading}>
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.row}>
                                {[7, 8, 9].map((num) => (
                                    <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num.toString())} disabled={isLoading}>
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.row}>
                                <View style={styles.keyHidden} />
                                <TouchableOpacity style={styles.key} onPress={() => handlePress('0')} disabled={isLoading}>
                                    <Text style={styles.keyText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.key, styles.backspaceKey]} onPress={handleBackspace} disabled={isLoading}>
                                    <Feather name="delete" size={24} color="#6366F1" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.spacer} />

                        <TouchableOpacity onPress={handleReset} style={styles.resetButton} disabled={isLoading}>
                            <Text style={styles.resetText}>RESET</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    overlayTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        paddingBottom: 40, // Ensure bottom padding for safe area
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    closeButton: {
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 40,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
    },
    dotFilled: {
        backgroundColor: '#1E293B', // Dark filled state
    },
    keypad: {
        width: '100%',
        paddingHorizontal: 40,
        gap: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    key: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#0F172A', // Dark Navy
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    keyHidden: {
        width: 72,
        height: 72,
    },
    backspaceKey: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    spacer: {
        flex: 1,
    },
    resetButton: {
        marginTop: 20,
        padding: 10,
    },
    resetText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1,
    },
});
