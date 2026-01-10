import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');

interface AddCardScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'my-cards') => void;
}

export default function AddCardScreen({ onNavigate }: AddCardScreenProps) {
    // Camera Permission
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);

    // Form inputs
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [holderName, setHolderName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

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

    const formatCardNumber = (text: string) => {
        const clean = text.replace(/\D/g, '');
        const groups = clean.match(/.{1,4}/g);
        return groups ? groups.join(' ') : clean;
    };

    const handleCardNumberChange = (text: string) => {
        const formatted = formatCardNumber(text);
        if (formatted.length <= 19) {
            setCardNumber(formatted);
        }
    };

    const handleAddCard = () => {
        // Here we would validate and save to global state/context/storage
        console.log("Adding card", { cardType, cardName, cardNumber, holderName, expiry, cvv });
        onNavigate('my-cards');
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

            {/* Background Decoration */}
            <View style={styles.bgDecoration} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add New Card</Text>
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
                                        colors={['#D97706', '#B45309']}
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

                            {/* Scan Trigger Button (Minimal) */}
                            {!isScanning && (
                                <TouchableOpacity onPress={startScan} activeOpacity={0.7} style={styles.scanTriggerButton}>
                                    <MaterialCommunityIcons name="line-scan" size={20} color="#F59E0B" />
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
                            onChangeText={setCardName}
                        />

                        <Text style={styles.inputLabel}>Card Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0000 0000 0000 0000"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={cardNumber}
                            onChangeText={handleCardNumberChange}
                        />

                        <Text style={styles.inputLabel}>Card Holder Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YOUR NAME"
                            placeholderTextColor="#94A3B8"
                            value={holderName}
                            onChangeText={setHolderName}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 16 }}>
                                <Text style={styles.inputLabel}>Expiry Date</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="MM/YY"
                                    placeholderTextColor="#94A3B8"
                                    value={expiry}
                                    onChangeText={setExpiry}
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
                                    onChangeText={setCvv}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.addCardButton} onPress={handleAddCard}>
                            <Text style={styles.addCardButtonText}>Add Card</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Navigation Bar */}
                <View style={styles.bottomNavContainer}>
                    <View style={styles.bottomNav}>
                        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('dashboard')}>
                            <Ionicons name="home" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('friends')}>
                            <FontAwesome5 name="user-friends" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('profile')}>
                            <FontAwesome5 name="user" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFBEB',
    },
    bgDecoration: {
        position: 'absolute',
        top: -150,
        right: -50,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#FEF3C7',
        opacity: 0.5,
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

    // Scan Trigger Button (Minimal)
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
        color: '#F59E0B',
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
        borderColor: '#F59E0B',
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
    typeButtonActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
    typeText: { fontWeight: '600', color: '#64748B' },
    typeTextActive: { color: '#FFFFFF' },
    row: { flexDirection: 'row' },
    addCardButton: {
        backgroundColor: '#F59E0B', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
        shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 10,
    },
    addCardButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

    // Bottom Nav
    bottomNavContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
    bottomNav: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 20,
        borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, gap: 30,
    },
    navItem: { padding: 10 },
});
