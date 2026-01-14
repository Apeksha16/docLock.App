import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Alert, Animated } from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { firestoreService } from './services/firestoreService';
import { encryptionService } from './services/encryptionService';
import BottomNavBar from './components/BottomNavBar';

const { width } = Dimensions.get('window');

// -------------------------------------------------------------
// THEMES (Matched with MyCardsScreen)
// -------------------------------------------------------------
const DEBIT_THEMES = [
    ['#EA580C', '#FB923C'] as const,
    ['#0891B2', '#22D3EE'] as const,
    ['#4D7C0F', '#84CC16'] as const,
    ['#BE185D', '#F472B6'] as const,
    ['#7C3AED', '#A78BFA'] as const,
];

const CREDIT_THEMES = [
    ['#064E3B', '#059669'] as const,
    ['#4C1D95', '#7C3AED'] as const,
    ['#0F172A', '#334155'] as const,
    ['#881337', '#BE123C'] as const,
    ['#78350F', '#B45309'] as const,
];

interface AddCardScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'my-cards') => void;
    userId: string;
    cardToEdit?: any; // Optional card data for editing
}

export default function AddCardScreen({ onNavigate, userId, cardToEdit }: AddCardScreenProps) {
    // Camera Permission
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form inputs
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [holderName, setHolderName] = useState('NEW USER');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    // Real-time Validation State: 'neutral' | 'valid' | 'invalid'
    const [numValidation, setNumValidation] = useState<'neutral' | 'valid' | 'invalid'>('neutral');
    const [dateValidation, setDateValidation] = useState<'neutral' | 'valid' | 'invalid'>('neutral');

    // Preview: Pick a random theme index for visualization (so user sees "A" color)
    // We can randomize this on mount, or just use 0.
    // Let's use a ref to keep it stable during typing, but depend on cardType
    const previewThemeIndex = useRef(Math.floor(Math.random() * 5)).current;

    // Animation for background decoration
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulsing animation for background circle
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Helper functions need to be defined before usage or useEffect
    const formatCardNumber = (text: string) => {
        const clean = text.replace(/\D/g, '');
        const groups = clean.match(/.{1,4}/g);
        return groups ? groups.join(' ') : clean;
    };

    const validateLuhnCheck = (num: string) => {
        const digits = num.replace(/\D/g, '');
        if (digits.length < 13) return false;
        let sum = 0;
        let shouldDouble = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits.charAt(i));
            if (shouldDouble) {
                if ((digit *= 2) > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return (sum % 10 === 0);
    };

    // Initialize state with cardToEdit using useEffect
    useEffect(() => {
        if (cardToEdit) {
            setLoading(true);
            try {
                setCardType(cardToEdit.cardType || 'debit');
                setCardName(cardToEdit.cardName || '');
                setHolderName(cardToEdit.holderName || 'NEW USER');

                const hasEncryptedData = cardToEdit.cardNumber && cardToEdit.cardNumber.trim() !== '';

                if (!hasEncryptedData) {
                    Alert.alert(
                        "Card Data Unavailable",
                        "This card was created before encryption was implemented. Sensitive details (card number, expiry, CVV) are not available for editing. Please delete this card and add it again.",
                        [{ text: "OK" }]
                    );
                    setLoading(false);
                    return;
                }

                if (cardToEdit.cardNumber) {
                    const decryptedNum = encryptionService.decryptData(cardToEdit.cardNumber);
                    setCardNumber(formatCardNumber(decryptedNum));

                    if (decryptedNum.length >= 13 && validateLuhnCheck(decryptedNum)) {
                        setNumValidation('valid');
                    }
                }

                if (cardToEdit.expiry) {
                    const decryptedExpiry = encryptionService.decryptData(cardToEdit.expiry);
                    setExpiry(decryptedExpiry);
                    setDateValidation('valid');
                }

                if (cardToEdit.cvv) {
                    const decryptedCvv = encryptionService.decryptData(cardToEdit.cvv);
                    setCvv(decryptedCvv);
                }
            } catch (e) {
                Alert.alert("Error", "Could not decrypt card details.");
            } finally {
                setLoading(false);
            }
        } else {
            setCardType('debit');
            setCardName('');
            setCardNumber('');
            setHolderName('NEW USER');
            setExpiry('');
            setCvv('');
            setNumValidation('neutral');
            setDateValidation('neutral');
        }
    }, [cardToEdit]);

    const getBorderColor = (status: 'neutral' | 'valid' | 'invalid') => {
        if (status === 'valid') return '#22C55E'; // Green
        if (status === 'invalid') return '#EF4444'; // Red
        return 'transparent'; // Default handled by style
    };

    const detectCardBrand = (number: string) => {
        const clean = number.replace(/\s+/g, '');
        if (clean.length === 0) return 'VISA';
        if (/^4/.test(clean)) return 'VISA';
        if (/^5[1-5]/.test(clean)) return 'MASTERCARD';
        if (/^2[2-7]/.test(clean)) return 'MASTERCARD';
        if (/^(60|65|81|82|508)/.test(clean)) return 'RUPAY';
        if (/^3[47]/.test(clean)) return 'AMEX';
        return 'CARD';
    };

    const handleCardNameChange = (text: string) => {
        // Max 50, Alphanumeric + Space
        const clean = text.replace(/[^a-zA-Z0-9 ]/g, '');
        if (clean.length <= 50) setCardName(clean);
    };

    const handleHolderNameChange = (text: string) => {
        // Max 30, Alphabets + Space
        const clean = text.replace(/[^a-zA-Z ]/g, '');
        if (clean.length <= 30) setHolderName(clean);
    };

    const handleCvvChange = (text: string) => {
        // Numeric only, max 4
        const clean = text.replace(/\D/g, '');
        if (clean.length <= 4) setCvv(clean);
    };

    const handleExpiryChange = (text: string) => {
        // Handle deletion
        if (text.length < expiry.length) {
            setExpiry(text);
            return;
        }

        let clean = text.replace(/\D/g, '');
        if (clean.length > 4) clean = clean.slice(0, 4);

        // Smart month entry: if first digit is > 3, auto-prepend 0
        // e.g., typing "4" becomes "04", "9" becomes "09"
        if (clean.length === 1 && parseInt(clean) > 3) {
            clean = '0' + clean;
        }

        // Validate Month
        if (clean.length >= 2) {
            const month = parseInt(clean.slice(0, 2));
            if (month === 0 || month > 12) {
                // Invalid month entered, ignore last char
                clean = clean.slice(0, 1);
            }
        }

        // Auto-slash
        let formatted = clean;
        if (clean.length >= 2) {
            formatted = clean.slice(0, 2) + '/' + clean.slice(2);
        }

        // Real-time Expiry Logic
        // Validate when full MM/YY is entered (5 chars)
        if (formatted.length === 5) {
            const [expMonth, expYear] = formatted.split('/').map((num: string) => parseInt(num));
            const now = new Date();
            const currentYear = parseInt(now.getFullYear().toString().slice(-2)); // e.g. 26

            // Allow years: Current Year - 2 onwards
            // e.g. If 2026, allow 24, 25, 26, 27...
            const minYear = currentYear - 2;

            if (expYear >= minYear && expMonth >= 1 && expMonth <= 12) {
                setDateValidation('valid');
            } else {
                setDateValidation('invalid');
            }
        } else {
            setDateValidation('neutral');
        }

        setExpiry(formatted);
    };

    const handleCardNumberChange = (text: string) => {
        const formatted = formatCardNumber(text);
        if (formatted.length <= 23) { // 19 digits + spaces
            setCardNumber(formatted);

            // Real-time Luhn Check
            const raw = formatted.replace(/\D/g, '');
            if (raw.length >= 13) {
                if (validateLuhnCheck(raw)) {
                    setNumValidation('valid');
                } else {
                    setNumValidation('invalid');
                }
            } else {
                setNumValidation('neutral');
            }
        }
    };

    const validateCard = () => {
        // Simple Checks
        if (!cardName.trim()) { Alert.alert('Invalid Input', 'Please enter a card nickname.'); return false; }
        if (!cardNumber.replace(/\s+/g, '').match(/^\d{13,19}$/)) { Alert.alert('Invalid Card', 'Check card number.'); return false; }
        if (!holderName.trim()) { Alert.alert('Invalid Input', 'Please enter holder name.'); return false; }

        // Expiry Validation: MM/YY
        if (!expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) { Alert.alert('Invalid Expiry', 'Use MM/YY format.'); return false; }
        const [expMonth, expYear] = expiry.split('/').map((num: string) => parseInt(num));
        const now = new Date();
        const currentYear = parseInt(now.getFullYear().toString().slice(-2)); // last 2 digits
        const currentMonth = now.getMonth() + 1;

        // "Year must be >= currentYear - 2" (Allow recent expired cards as per request)
        const minYear = currentYear - 2;
        if (expYear < minYear) {
            Alert.alert('Invalid Expiry', 'Card expired too long ago.');
            return false;
        }
        if (expYear === currentYear && expMonth < currentMonth) {
            Alert.alert('Invalid Expiry', 'Card has expired.');
            return false;
        }

        if (!cvv.match(/^\d{3,4}$/)) { Alert.alert('Invalid CVV', 'Check CVV (3-4 digits).'); return false; }

        // Luhn Algorithm
        const digits = cardNumber.replace(/\D/g, '');
        let sum = 0;
        let shouldDouble = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits.charAt(i));
            if (shouldDouble) {
                if ((digit *= 2) > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        if (sum % 10 !== 0) {
            Alert.alert('Invalid Card', 'Card number is invalid (Luhn check failed).');
            return false;
        }

        return true;
    };

    const handleAddCard = async () => {
        if (!validateCard()) return;

        setLoading(true);
        // Passed validation
        try {
            // Generate a random theme index (0-4) for new cards
            // 0: Gold, 1: Rose, 2: Midnight, 3: Teal, 4: Purple
            const themeIndex = cardToEdit ? (cardToEdit.themeIndex ?? Math.floor(Math.random() * 5)) : Math.floor(Math.random() * 5);

            const cardData = {
                cardType,
                cardName,
                cardNumber: cardNumber.replace(/\s+/g, ''), // Plaintext passed to service, service encrypts it
                holderName,
                expiry,
                cvv,
                themeIndex // Save the selected theme
            };

            if (cardToEdit) {
                await firestoreService.updateCard(userId, cardToEdit.id, cardData);
                Alert.alert('Success', 'Card updated successfully!', [
                    { text: 'OK', onPress: () => onNavigate('my-cards') }
                ]);
            } else {
                await firestoreService.addCard(userId, cardData);
                Alert.alert('Success', 'Card added securely!', [
                    { text: 'OK', onPress: () => onNavigate('my-cards') }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save card.');
        } finally {
            setLoading(false);
        }
    };

    const startScan = async () => {
        if (!permission) {
            // Permission not loaded yet
            return;
        }
        if (!permission.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert("Permission Required", "Camera permission is needed to scan cards.");
                return;
            }
        }
        setIsScanning(true);

        // Simulate OCR Delay
        setTimeout(() => {
            // Mock captured data
            setCardNumber('4532 7564 1234 9876');
            setHolderName('APEKSHA VERMA');
            setExpiry('12/28');
            setCardType('credit');
            setCardName('Personal Platinum');

            setIsScanning(false);
        }, 2500); // 2.5s scan simulation
    };

    const cancelScan = () => {
        setIsScanning(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Animated Background Decoration */}
            <Animated.View style={[styles.bgDecoration, { transform: [{ scale: scaleAnim }] }]} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => onNavigate('my-cards')} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{cardToEdit ? 'Edit Card' : 'Add New Card'}</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView
                        style={styles.formScrollView}
                        contentContainerStyle={styles.formContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* ============================================================
                           ADAPTIVE CARD AREA:
                           Either shows the "Gradient Preview" OR the "Live Camera"
                           ============================================================ */}
                        <View style={styles.previewSection}>
                            <View style={styles.cardContainer}>
                                {isScanning ? (
                                    <View style={{ flex: 1 }}>
                                        <CameraView
                                            style={StyleSheet.absoluteFill}
                                            facing="back"
                                        />
                                        {/* Overlay Guides */}
                                        <View style={styles.cameraOverlay}>
                                            <View style={styles.scanGuide} />
                                            <Text style={styles.scanningText}>Align Card...</Text>
                                            <TouchableOpacity style={styles.closeCameraButton} onPress={cancelScan}>
                                                <Feather name="x" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <LinearGradient
                                        colors={cardType === 'credit' ? CREDIT_THEMES[previewThemeIndex] : DEBIT_THEMES[previewThemeIndex]}
                                        style={styles.cardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <View style={styles.cardTopRow}>
                                            <View>
                                                <Text style={styles.previewLabel}>CARD NAME</Text>
                                                <Text style={styles.previewValue}>{cardName || 'CARD NAME'}</Text>
                                                <Text style={styles.previewSubLabel}>{cardType === 'debit' ? 'DEBIT CARD' : 'CREDIT CARD'}</Text>
                                            </View>
                                            <View style={styles.visaBadge}><Text style={styles.visaText}>{detectCardBrand(cardNumber)}</Text></View>
                                        </View>

                                        <View style={styles.cardBody}>
                                            <Text style={styles.previewNumber}>{cardNumber || '0000 0000 0000 0000'}</Text>
                                        </View>

                                        <View style={styles.cardFooter}>
                                            <View>
                                                <Text style={styles.footerLabel}>CARD HOLDER</Text>
                                                <Text style={styles.footerValue}>{holderName || 'YOUR NAME'}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 20 }}>
                                                <View>
                                                    <Text style={styles.footerLabel}>EXPIRES</Text>
                                                    <Text style={styles.footerValue}>{expiry || 'MM/YY'}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <View>
                                                        <Text style={styles.footerLabel}>CVV</Text>
                                                        <Text style={styles.footerValue}>{cvv || '123'}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                )}
                            </View>

                            {/* Scan Trigger Button (Minimal) - Only show when adding new card */}
                            {!isScanning && !cardToEdit && (
                                <TouchableOpacity onPress={startScan} activeOpacity={0.7} style={styles.scanTriggerButton}>
                                    <MaterialCommunityIcons name="line-scan" size={20} color="#EC4899" />
                                    <Text style={styles.scanTriggerText}>Scan Card</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Manual Form (Always Visible) */}
                        <Text style={styles.inputLabel}>Card Type</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeButton, cardType === 'debit' && styles.typeButtonActive]}
                                onPress={() => setCardType('debit')}
                            >
                                <FontAwesome5 name="university" size={16} color={cardType === 'debit' ? "#FFFFFF" : "#64748B"} style={{ marginRight: 8 }} />
                                <Text style={[styles.typeText, cardType === 'debit' && styles.typeTextActive]}>Debit Card</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, cardType === 'credit' && styles.typeButtonActive]}
                                onPress={() => setCardType('credit')}
                            >
                                <FontAwesome5 name="credit-card" size={16} color={cardType === 'credit' ? "#FFFFFF" : "#64748B"} style={{ marginRight: 8 }} />
                                <Text style={[styles.typeText, cardType === 'credit' && styles.typeTextActive]}>Credit Card</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Card Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Personal Visa"
                            placeholderTextColor="#94A3B8"
                            value={cardName}
                            onChangeText={handleCardNameChange}
                            maxLength={50}
                        />

                        <Text style={styles.inputLabel}>Card Number</Text>
                        <TextInput
                            style={[
                                styles.input,
                                numValidation !== 'neutral' && { borderWidth: 1, borderColor: getBorderColor(numValidation) }
                            ]}
                            placeholder="0000 0000 0000 0000"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={cardNumber}
                            onChangeText={handleCardNumberChange}
                            maxLength={23} // 19 digits + spaces
                        />

                        <Text style={styles.inputLabel}>Card Holder Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YOUR NAME"
                            placeholderTextColor="#94A3B8"
                            value={holderName}
                            onChangeText={handleHolderNameChange}
                            autoCapitalize="characters"
                            maxLength={30}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 16 }}>
                                <Text style={styles.inputLabel}>Expiry Date</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        dateValidation !== 'neutral' && { borderWidth: 1, borderColor: getBorderColor(dateValidation) }
                                    ]}
                                    placeholder="MM/YY"
                                    placeholderTextColor="#94A3B8"
                                    value={expiry}
                                    onChangeText={handleExpiryChange}
                                    keyboardType="numeric"
                                    maxLength={5}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>CVV</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    secureTextEntry
                                    value={cvv}
                                    onChangeText={handleCvvChange}
                                    maxLength={4}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.addCardButton}
                            onPress={handleAddCard}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.addCardButtonText}>{cardToEdit ? 'UPDATE CARD' : 'ADD CARD'}</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Shared Bottom Navigation Bar */}
                <BottomNavBar currentScreen="dashboard" onNavigate={(screen: any) => onNavigate(screen)} activeColor="#EC4899" />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Light gray to match MyCardsScreen
    },
    bgDecoration: {
        position: 'absolute',
        top: -150,
        right: -50,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#FCE7F3', // Light pink to match MyCardsScreen
        opacity: 0.6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },

    // Preview Section (Adaptive)
    previewSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    cardContainer: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        backgroundColor: '#000', // Camera bg
    },

    // Gradient Card Styles
    cardGradient: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    previewLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '700', marginBottom: 4 },
    previewValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
    previewSubLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '600' },
    visaBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    visaText: { color: 'white', fontWeight: '700', fontSize: 10 },
    cardBody: { justifyContent: 'center' },
    previewNumber: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    footerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 7, fontWeight: '700', marginBottom: 2 },
    footerValue: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

    // Scan Trigger Button
    scanTriggerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.08)', // Faint Amber
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12, // Tech minimal
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        gap: 8,
    },
    scanTriggerText: {
        color: '#EC4899',
        fontWeight: '600',
        fontSize: 14,
    },

    // Camera Styles
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scanGuide: {
        width: '80%',
        height: '60%',
        borderWidth: 2,
        borderColor: '#EC4899',
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    scanningText: {
        color: '#FFF',
        marginTop: 12,
        fontWeight: '600',
        fontSize: 14,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    closeCameraButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 6,
        borderRadius: 16,
    },

    // Form
    formScrollView: { flex: 1 },
    formContent: { paddingHorizontal: 24, paddingBottom: 150 },

    inputLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
    input: {
        backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16,
        fontSize: 13, color: '#1E293B', fontWeight: '500', marginBottom: 20,
        shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1, shadowRadius: 4, elevation: 1,
    },
    typeSelector: { flexDirection: 'row', marginBottom: 24, gap: 16 },
    typeButton: {
        flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
    },
    typeButtonActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
    typeText: { fontWeight: '600', color: '#64748B' },
    typeTextActive: { color: '#FFFFFF' },
    row: { flexDirection: 'row' },
    addCardButton: {
        backgroundColor: '#EC4899', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
        shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 10,
    },
    addCardButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
