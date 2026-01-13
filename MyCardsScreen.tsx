import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firestoreService } from './services/firestoreService';
import { notificationService } from './services/notificationService'; // Added import
import * as Clipboard from 'expo-clipboard';
import { encryptionService } from './services/encryptionService';
import BottomNavBar from './components/BottomNavBar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface MyCardsScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'add-card', params?: any) => void;
    userId: string;
    cards: any[];
}


export default function MyCardsScreen({ onNavigate, userId, cards }: MyCardsScreenProps) {
    const loading = false; // Data is preloaded




    const formatDisplayCardNumber = (encryptedNumber: string) => {
        try {
            const decrypted = encryptionService.decryptData(encryptedNumber);
            if (!decrypted || decrypted.length < 8) return '•••• •••• •••• ••••'; // Fallback

            const first4 = decrypted.slice(0, 4);
            const last4 = decrypted.slice(-4);

            return `${first4} ${decrypted.slice(4, -4).replace(/\d/g, '•').replace(/(.{4})/g, '$1 ')} ${last4}`.replace(/\s+/g, ' ').trim();
            // Or simpler: just first 4 and last 4 with fixed dots if we don't care about precise length matching middle
            // User requested: "full card number should be visible with starting four numbers and ending 4 numbers rest will be hidden"
            // Example: 1234 •••• •••• 5678 (assuming 16 digits)

            // Precise replacement:
            const middle = decrypted.slice(4, -4);
            const maskedMiddle = middle.replace(/\d/g, '•');
            // Add spaces every 4 chars for readability
            const formatted = `${first4}${maskedMiddle}${last4}`.match(/.{1,4}/g)?.join(' ') || '';
            return formatted;
        } catch (e) {
            return '•••• •••• •••• ••••';
        }
    };

    const handleCopy = async (text: string, label: string) => {
        // We might want to copy the DECRYPTED text if user taps
        // Text coming in might be encrypted if we pass card.cardNumber directly
        // So let's handle decryption here if needed, or pass decrypted
        let content = text;
        // If it looks encrypted (long string), try decrypt. Or just standardized flow:
        // Actually, handleCopy below is called with card.cardNumber which IS Encrypted in DB.
        // So we should decrypt it before copying to clipboard.
        const decrypted = encryptionService.decryptData(text);
        if (decrypted) content = decrypted;

        await Clipboard.setStringAsync(content);
        Alert.alert('Copied', `${label} copied to clipboard.`);

        // Notify
        // Since userId is available in props
        if (userId) {
            notificationService.sendNotification(userId, 'Card Shared', `You copied ${label} of a card to clipboard.`, 'system');
        }
    };

    const handleDelete = (cardId: string) => {
        Alert.alert(
            "Delete Card",
            "Are you sure you want to delete this card?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await firestoreService.deleteCard(userId, cardId); // Assuming deleteCard exists or implementing logic
                            // Refresh list locally
                            // setCards(prev => prev.filter(c => c.id !== cardId)); // Synced automatically now
                            Alert.alert("Deleted", "Card has been removed.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete card.");
                        }
                    }
                }
            ]
        );
    };

    const renderCardItem = (card: any) => {
        return (
            <LinearGradient
                key={card.id}
                colors={['#DC362E', '#E85D35']} // Red to Orange gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardContainer}
            >
                {/* Visual texture/circles */}
                <View style={styles.cardTexture}>
                    <View style={[styles.circle, { top: -50, right: -50, width: 200, height: 200, opacity: 0.1 }]} />
                </View>

                {/* Top Row: Actions & Brand */}
                <View style={styles.cardHeader}>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('add-card', { cardData: card })}>
                            <Feather name="edit-2" size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(card.id)}>
                            <Feather name="trash-2" size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => handleCopy(card.cardNumber, "Card Number")}>
                            <Feather name="share-2" size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.brandBadge}>
                        <Text style={styles.brandText}>{card.cardType === 'credit' ? 'VISA' : 'VISA'}</Text>
                    </View>
                </View>

                {/* Card Name */}
                <Text style={styles.cardNameLabel}>{card.cardName || 'CARD NAME'}</Text>

                {/* Number */}
                <TouchableOpacity onPress={() => handleCopy(card.cardNumber, "Card Number")}>
                    <Text style={styles.cardNumber}>{formatDisplayCardNumber(card.cardNumber)}</Text>
                </TouchableOpacity>

                {/* Details Footer */}
                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.detailLabel}>CARD HOLDER</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>{card.holderName || userPlaceholderName}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 24 }}>
                        <View>
                            <Text style={styles.detailLabel}>EXPIRES</Text>
                            <Text style={styles.detailValue}>{encryptionService.decryptData(card.expiry) || 'MM/YY'}</Text>
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>CVV</Text>
                            <Text style={styles.detailValue}>•••</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        );
    };

    const userPlaceholderName = "USER NAME"; // Fallback
    const debitCards = cards.filter(c => c.cardType === 'debit' || !c.cardType);
    const creditCards = cards.filter(c => c.cardType === 'credit');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Decoration (Pink/Purplish top right) */}
            <View style={styles.bgDecoration} />

            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>My Cards</Text>
                        <Text style={styles.headerSubtitle}>Total {cards.length} cards</Text>
                    </View>

                    <TouchableOpacity style={styles.addButton} onPress={() => onNavigate('add-card')}>
                        <Feather name="plus" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Tip Banner */}
                <View style={styles.tipContainer}>
                    <Feather name="info" size={14} color="#2563EB" />
                    <Text style={styles.tipText}>Tip: Click any card detail to copy it.</Text>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#E11D48" />
                    </View>
                ) : (
                    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>

                        {/* Debit Cards Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Debit Cards</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{debitCards.length} cards</Text>
                            </View>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        >
                            {debitCards.length > 0 ? debitCards.map(renderCardItem) : (
                                <Text style={styles.noCardsText}>No debit cards added.</Text>
                            )}
                        </ScrollView>

                        {/* Credit Cards Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Credit Cards</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{creditCards.length} cards</Text>
                            </View>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        >
                            {creditCards.length > 0 ? creditCards.map(renderCardItem) : (
                                <Text style={styles.noCardsText}>No credit cards added.</Text>
                            )}
                        </ScrollView>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* Shared Bottom Navigation Bar */}
                <BottomNavBar currentScreen="my-cards" onNavigate={(screen: any) => onNavigate(screen)} />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Very light blue/gray base
    },
    bgDecoration: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: '#FAE8FF', // Light Purple
        opacity: 0.6,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E11D48', // Rose 600
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF', // Blue 50
        marginHorizontal: 24,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        gap: 8,
        marginBottom: 20,
    },
    tipText: {
        fontSize: 12,
        color: '#1E40AF',
        fontWeight: '500',
    },
    contentScroll: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    countBadge: {
        backgroundColor: '#DCFCE7', // Green 100
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    countText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#15803D', // Green 700
    },
    horizontalList: {
        paddingLeft: 24,
        paddingRight: 8, // +16 margin on last card = 24
        paddingBottom: 24, // Space for shadow
    },
    noCardsText: {
        marginLeft: 24,
        color: '#94A3B8',
        fontStyle: 'italic',
        marginBottom: 24,
    },

    // CARD STYLES
    cardContainer: {
        width: 300,
        height: 190,
        borderRadius: 24,
        padding: 24,
        marginRight: 16,
        justifyContent: 'space-between',
        // Shadow/Elevation handled but overflow hidden for gradient often clips it on Android. 
        // iOS handles shadow on layout usually.
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    cardTexture: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        borderRadius: 24,
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#FFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    brandText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    cardNameLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 10,
        textTransform: 'uppercase',
    },
    cardNumber: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    detailLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 8,
        fontWeight: '700',
        marginBottom: 2,
    },
    detailValue: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

});

