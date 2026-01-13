import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, ActivityIndicator, Alert, Modal } from 'react-native';
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
    const formatDisplayCardNumber = (encryptedNumber: string) => {
        try {
            const decrypted = encryptionService.decryptData(encryptedNumber);
            if (!decrypted || decrypted.length < 8) return '•••• •••• •••• ••••';

            const first4 = decrypted.slice(0, 4);
            const last4 = decrypted.slice(-4);
            const middle = decrypted.slice(4, -4).replace(/\d/g, '•');

            // Format with spaces every 4 chars
            const formatted = `${first4}${middle}${last4}`.match(/.{1,4}/g)?.join(' ') || '';
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

        // Notify removed as per request
    };

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openDeleteModal = (card: any) => {
        setCardToDelete(card);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!cardToDelete || !userId) return;
        setIsDeleting(true);
        try {
            await firestoreService.deleteCard(userId, cardToDelete.id);
            setDeleteModalVisible(false);
            setCardToDelete(null);
        } catch (error) {
            Alert.alert("Error", "Failed to delete card.");
        } finally {
            setIsDeleting(false);
        }
    };

    const renderCardItem = (card: any) => {
        // Determine gradient colors based on card type
        const gradientColors = card.cardType === 'credit'
            ? ['#A77979', '#B88A8A'] as const // Credit card - rose/mauve gradient
            : ['#E5C95F', '#EDD786'] as const; // Debit card - golden/yellow gradient

        return (
            <LinearGradient
                key={card.id}
                colors={gradientColors}
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
                        <TouchableOpacity style={styles.iconButton} onPress={() => openDeleteModal(card)}>
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
                <TouchableOpacity onPress={() => handleCopy(card.cardName, "Card Name")}>
                    <Text style={styles.cardNameLabel}>{card.cardName || 'CARD NAME'}</Text>
                </TouchableOpacity>

                {/* Number */}
                <TouchableOpacity onPress={() => handleCopy(card.cardNumber, "Card Number")}>
                    <Text style={styles.cardNumber}>{formatDisplayCardNumber(card.cardNumber)}</Text>
                </TouchableOpacity>

                {/* Details Footer */}
                <View style={styles.cardFooter}>
                    <TouchableOpacity onPress={() => handleCopy(card.holderName, "Holder Name")}>
                        <Text style={styles.detailLabel}>CARD HOLDER</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>{card.holderName || userPlaceholderName}</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 24 }}>
                        <TouchableOpacity onPress={() => handleCopy(card.expiry, "Expiry Date")}>
                            <Text style={styles.detailLabel}>EXPIRES</Text>
                            <Text style={styles.detailValue}>{encryptionService.decryptData(card.expiry) || 'MM/YY'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleCopy(card.cvv, "CVV")}>
                            <Text style={styles.detailLabel}>CVV</Text>
                            <Text style={styles.detailValue}>•••</Text>
                        </TouchableOpacity>
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
                    <Text style={styles.headerTitle}>My Cards</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Tip Banner */}
                <View style={styles.tipContainer}>
                    <Feather name="info" size={14} color="#2563EB" />
                    <Text style={styles.tipText}>Tip: Click any card detail to copy it.</Text>
                </View>

                {/* Content Section */}
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

            </SafeAreaView>

            {/* Delete Confirmation Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setDeleteModalVisible(false)} />
                    <View style={styles.modalBottomSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalIconContainer}>
                            <Feather name="trash-2" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Delete Card?</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure you want to delete <Text style={{ fontWeight: '700', color: '#0F172A' }}>{cardToDelete?.cardName}</Text>?
                        </Text>
                        <Text style={styles.modalWarning}>This action cannot be undone.</Text>

                        <TouchableOpacity
                            style={styles.modalDeleteButton}
                            onPress={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.modalDeleteButtonText}>Yes, Delete</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setDeleteModalVisible(false)}
                            disabled={isDeleting}
                        >
                            <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* FAB Button for Add Card */}
            <View style={styles.fabWrapper}>
                <TouchableOpacity
                    style={styles.fabButton}
                    onPress={() => onNavigate('add-card')}
                >
                    <Feather name="plus" size={32} color="white" />
                </TouchableOpacity>
            </View>

            {/* Shared Bottom Navigation Bar */}
            <BottomNavBar currentScreen="dashboard" onNavigate={(screen: any) => onNavigate(screen)} activeColor="#EC4899" />
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
        backgroundColor: '#FCE7F3', // Light Pink
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
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
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

    // FAB Button for Add Card
    fabWrapper: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        zIndex: 10,
    },
    fabButton: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: '#EC4899', // Pink 500 to match cards theme
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        alignItems: 'center',
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 20,
    },
    modalIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalWarning: {
        fontSize: 12,
        color: '#EF4444',
        marginBottom: 24,
    },
    modalDeleteButton: {
        width: '100%',
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    modalDeleteButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    modalCancelButton: {
        paddingVertical: 12,
    },
    modalCancelButtonText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 16,
    },
});

