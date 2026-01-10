import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

interface SecurityPinModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function SecurityPinModal({ visible, onClose }: SecurityPinModalProps) {
    const [pin, setPin] = useState<string[]>([]);
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [firstPin, setFirstPin] = useState<string[]>([]);
    const { height: screenHeight } = useWindowDimensions();

    const handlePress = (value: string) => {
        if (pin.length < 4) {
            setPin([...pin, value]);
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleReset = () => {
        setPin([]);
        setStep('create');
        setFirstPin([]);
    };

    useEffect(() => {
        if (pin.length === 4) {
            if (step === 'create') {
                // Determine completion of first step
                const timeout = setTimeout(() => {
                    setFirstPin(pin);
                    setPin([]);
                    setStep('confirm');
                }, 300); // Small delay for UX
                return () => clearTimeout(timeout);
            } else {
                // Confirm step
                if (pin.join('') === firstPin.join('')) {
                    console.log('PIN Successfully Set:', pin.join(''));
                    // Close on success
                    setTimeout(() => {
                        onClose();
                        // Reset state for next time
                        setPin([]);
                        setStep('create');
                        setFirstPin([]);
                    }, 300);
                } else {
                    console.log('PIN Mismatch');
                    alert('PINs do not match. Please try again.');
                    setPin([]);
                    setStep('create'); // Start over
                    setFirstPin([]);
                }
            }
        }
    }, [pin, step, firstPin]);

    // Reset PIN when modal opens
    useEffect(() => {
        if (visible) {
            setPin([]);
            setStep('create');
            setFirstPin([]);
        }
    }, [visible]);

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
                        <Text style={styles.title}>Security PIN</Text>
                        <Text style={styles.subtitle}>
                            {step === 'create' ? 'Create a 4-digit PIN' : 'Confirm your 4-digit PIN'}
                        </Text>

                        {/* PIN Dots */}
                        <View style={styles.dotsContainer}>
                            {[0, 1, 2, 3].map(renderDot)}
                        </View>

                        {/* Keypad */}
                        <View style={styles.keypad}>
                            <View style={styles.row}>
                                {[1, 2, 3].map((num) => (
                                    <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num.toString())}>
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.row}>
                                {[4, 5, 6].map((num) => (
                                    <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num.toString())}>
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.row}>
                                {[7, 8, 9].map((num) => (
                                    <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num.toString())}>
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.row}>
                                <View style={styles.keyHidden} />
                                <TouchableOpacity style={styles.key} onPress={() => handlePress('0')}>
                                    <Text style={styles.keyText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.key, styles.backspaceKey]} onPress={handleBackspace}>
                                    <Feather name="delete" size={24} color="#6366F1" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.spacer} />

                        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
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
