import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firestoreService } from './services/firestoreService';

const { width } = Dimensions.get('window');

interface MyCardsScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'add-card') => void;
    userId: string;
}

export default function MyCardsScreen({ onNavigate, userId }: MyCardsScreenProps) {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    useEffect(() => {
        fetchCards();
    }, [userId]);

    const fetchCards = async () => {
        try {
            if (!userId) return;
            const userCards = await firestoreService.getCards(userId);
            setCards(userCards);
            // Auto-expand the last card if exists (mimicking the "top of stack" look)
            if (userCards.length > 0) {
                setExpandedCardId(userCards[userCards.length - 1].id);
            }
        } catch (error) {
            console.error("Failed to fetch cards", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCard = (id: string) => {
        setExpandedCardId(expandedCardId === id ? null : id);
    };

    const getCardLogo = (type: string) => {
        // Simple logic for MVP, can be enhanced based on regex
        return <Text style={styles.brandText}>VISA</Text>;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitleMain}>My Credit</Text>
                        <Text style={styles.headerTitleSub}>Cards</Text>
                    </View>
                    <View style={styles.addCardContainer}>
                        <TouchableOpacity style={styles.addButton} onPress={() => onNavigate('add-card')}>
                            <Feather name="plus" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#000" />
                    </View>
                ) : cards.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No cards found.</Text>
                        <TouchableOpacity style={styles.addFirstButton} onPress={() => onNavigate('add-card')}>
                            <Text style={styles.addFirstText}>Add New Card</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {cards.map((card, index) => {
                            const isExpanded = expandedCardId === card.id;

                            // Visual Stack Logic
                            // If it's expanded, we might give it full height. 
                            // If collapsed, small height.
                            // Negative margin top for all except first to overlap.

                            return (
                                <TouchableOpacity
                                    key={card.id}
                                    activeOpacity={0.9}
                                    onPress={() => toggleCard(card.id)}
                                    style={[
                                        styles.cardContainer,
                                        {
                                            marginTop: index === 0 ? 0 : -50, // Stack overlap
                                            zIndex: index, // Ensure order
                                            backgroundColor: isExpanded ? '#1C1C1E' : '#D1FAE5', // Dark for active, Light Green for others (from image)
                                            // Alternate colors for variety if desired:
                                            // backgroundColor: isExpanded ? '#1C1C1E' : (index % 2 === 0 ? '#D1FAE5' : '#E0F2FE')
                                        }
                                    ]}
                                >
                                    {isExpanded ? (
                                        // EXPANDED STATE (Dark Card)
                                        <View style={styles.cardContentExpanded}>
                                            <View style={styles.cardRow}>
                                                <Text style={styles.cardMaskedExpanded}>**** {card.cardNumberMasked || '0000'}</Text>
                                                <View style={styles.logoContainerLight}>{getCardLogo(card.cardType)}</View>
                                            </View>

                                            <View style={styles.cardFooter}>
                                                <View>
                                                    <Text style={styles.labelExpanded}>Expire {card.expiry}</Text>
                                                    <Text style={styles.holderExpanded}>{card.holderName || 'CARD HOLDER'}</Text>
                                                </View>
                                                <TouchableOpacity style={styles.editButton}>
                                                    <Feather name="edit-2" size={16} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        // COLLAPSED STATE (Light Script)
                                        <View style={styles.cardContentCollapsed}>
                                            <Text style={styles.cardMaskedCollapsed}>**** {card.cardNumberMasked || '0000'}</Text>
                                            <View style={styles.logoContainerDark}>{getCardLogo(card.cardType)}</View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        {/* Spacer at bottom */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF7ED', // Restored Orange 50
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    headerTitleMain: {
        fontSize: 32,
        fontWeight: '300', // Thin
        color: '#1C1C1E',
        lineHeight: 38,
    },
    headerTitleSub: {
        fontSize: 32,
        fontWeight: '600', // Bold
        color: '#1C1C1E',
        lineHeight: 38,
    },
    addCardContainer: {
        alignItems: 'center',
        gap: 8,
    },
    addCardText: {
        fontSize: 12,
        color: '#6B7280',
        // fontWeight: '500',
    },
    addButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F97316', // Orange 500 (Themed)
        borderRadius: 12,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
    },
    addFirstButton: {
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
    },
    addFirstText: {
        color: '#FFF',
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    cardContainer: {
        borderRadius: 24,
        marginBottom: 0,
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2, // Upward shadow for stack effect
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    // EXPANDED STYLES
    cardContentExpanded: {
        height: 220,
        padding: 24,
        justifyContent: 'space-between',
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardMaskedExpanded: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '500',
        letterSpacing: 2,
    },
    logoContainerLight: {
        // Logo style for dark bg
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    labelExpanded: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 4,
    },
    holderExpanded: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    editButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // COLLAPSED STYLES
    cardContentCollapsed: {
        height: 100, // Enough to show top part
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardMaskedCollapsed: {
        fontSize: 18,
        color: '#1C1C1E',
        fontWeight: '500',
        letterSpacing: 2,
    },
    logoContainerDark: {
        // Logo style for light bg
    },
    brandText: {
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#1C1C1E', // Default dark
    }
});
