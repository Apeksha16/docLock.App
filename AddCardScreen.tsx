import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddCardScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'my-cards') => void;
}

export default function AddCardScreen({ onNavigate }: AddCardScreenProps) {
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >

                    {/* Header Decoration */}
                    <View style={styles.headerDecoration} />

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => onNavigate('my-cards')} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add New Card</Text>
                        <View style={{ width: 44 }} />
                    </View>



                    {/* Scrollable Form */}
                    <ScrollView
                        style={styles.formScrollView}
                        contentContainerStyle={styles.formContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Card Preview Section - Moved inside ScrollView */}
                        <View style={styles.previewContainer}>
                            <View style={styles.cardContainer}>
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
                                            <Text style={[styles.footerValue, { fontSize: 10, marginTop: 2 }]}>{holderName || 'YOUR NAME'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 20 }}>
                                            <View>
                                                <Text style={styles.footerLabel}>EXPIRES</Text>
                                                <Text style={styles.footerValue}>{expiry || 'MM/YY'}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.footerLabel}>CVV</Text>
                                                <Text style={styles.footerValue}>{cvv || '123'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>Card Type</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeButton, cardType === 'debit' && styles.typeButtonActive]}
                                onPress={() => setCardType('debit')}
                            >
                                {cardType === 'debit' && <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />}
                                <Text style={[styles.typeText, cardType === 'debit' && styles.typeTextActive]}>Debit Card</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, cardType === 'credit' && styles.typeButtonActive]}
                                onPress={() => setCardType('credit')}
                            >
                                {cardType === 'credit' && <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />}
                                <Text style={[styles.typeText, cardType === 'credit' && styles.typeTextActive]}>Credit Card</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Card Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Personal Visa, Business Card"
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


                        {/* Bottom Nav Placeholder within ScrollView for spacing - Removed as using padding now */}
                        {/* <View style={{ height: 100 }} /> */}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Navigation Bar */}
                <View style={styles.bottomNavContainer}>
                    <View style={styles.bottomNav}>
                        <TouchableOpacity style={styles.navItemActive}>
                            <Ionicons name="home" size={20} color="#FFFFFF" />
                            <Text style={styles.navTextActive}>Home</Text>
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
        backgroundColor: '#FFFBEB', // Light yellow background as per design
    },
    headerDecoration: {
        position: 'absolute',
        top: -150,
        right: -50,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#FEF3C7', // Pale yellow decoration
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
    previewContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 24,
        // Ensure this stays top if we used a different layout, but here it's just first item
    },
    cardContainer: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#B45309',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardGradient: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    previewLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 4,
    },
    previewValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    previewSubLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '600',
    },
    visaBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    visaText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
    cardBody: {
        justifyContent: 'center',
    },
    previewNumber: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    footerLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 8,
        fontWeight: '700',
        marginBottom: 2,
    },
    footerValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    // Form
    formScrollView: {
        flex: 1,
    },
    formContent: {
        paddingHorizontal: 24,
        paddingBottom: 220,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
        marginBottom: 24,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 1,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 16,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    typeButtonActive: {
        backgroundColor: '#10B981', // Emerald green
        borderColor: '#10B981',
    },
    typeText: {
        fontWeight: '600',
        color: '#64748B',
    },
    typeTextActive: {
        color: '#FFFFFF',
    },
    row: {
        flexDirection: 'row',
    },
    addCardButton: {
        backgroundColor: '#F59E0B', // Amber
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 10,
    },
    addCardButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    // Bottom Nav
    bottomNavContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        gap: 30,
    },
    navItem: {
        padding: 10,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        gap: 8,
    },
    navTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
});
