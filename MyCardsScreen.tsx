import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firestoreService } from './services/firestoreService';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface MyCardsScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'add-card', params?: any) => void;
    userId: string;
}

export default function MyCardsScreen({ onNavigate, userId }: MyCardsScreenProps) {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCards();
    }, [userId]);

    const fetchCards = async () => {
        try {
            if (!userId) return;
            const userCards = await firestoreService.getCards(userId);
            setCards(userCards);
        } catch (error) {
            console.error("Failed to fetch cards", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', `${label} copied to clipboard.`);
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
                            setCards(prev => prev.filter(c => c.id !== cardId));
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
                    <Text style={styles.cardNumber}>{card.cardNumberMasked ? card.cardNumberMasked.replace(/\*/g, '•') : '•••• •••• •••• 0000'}</Text>
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
                            <Text style={styles.detailValue}>{card.expiry}</Text>
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

    const filteredCards = cards.filter(c =>
        (c.cardName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.holderName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const debitCards = filteredCards.filter(c => c.cardType === 'debit' || !c.cardType);
    const creditCards = filteredCards.filter(c => c.cardType === 'credit');

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
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search Cards..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

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

                {/* Bottom Navigation Bar */}
                {/* Bottom Navigation Bar */}
                {/* Bottom Navigation Bar */}
                <View style={styles.bottomNavContainer}>
                    {/* FAB Button */}
                    <View style={styles.fabWrapper}>
                        <TouchableOpacity
                            style={styles.fabButton}
                            onPress={() => onNavigate('add-card')}
                        >
                            <Feather name="plus" size={32} color="white" />
                        </TouchableOpacity>
                    </View>

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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 24,
        marginBottom: 20,
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#0F172A',
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

    // Bottom Nav (Pill)
    // Bottom Nav (Pill) & FAB
    bottomNavContainer: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        alignItems: 'center',
    },
    fabWrapper: {
        marginBottom: 16,
        zIndex: 10,
    },
    fabButton: {
        width: 64,
        height: 64,
        borderRadius: 24, // Squircle-ish
        backgroundColor: '#E11D48', // Red/Rose to match MyCards theme
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    bottomNav: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        gap: 20,
    },
    navItem: {
        padding: 10,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1', // Indigo 500 (Homepage Style)
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

