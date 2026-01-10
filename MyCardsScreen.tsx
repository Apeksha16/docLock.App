import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Dimensions } from 'react-native';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MyCardsScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'add-card') => void;
}

export default function MyCardsScreen({ onNavigate }: MyCardsScreenProps) {
    const [cards, setCards] = useState<any[]>([]); // Start empty

    // Dummy data for populated state testing (comment out to test empty)
    // const [cards, setCards] = useState<any[]>([
    //     { id: 1, type: 'debit', holder: 'APEKSHA VERMA', number: '4315 .... .... 7018', expiry: '05/32', cvv: '...', bank: 'VISA' },
    //     { id: 2, type: 'credit', holder: 'APEKSHA VERMA', number: '4315 .... .... 7018', expiry: '05/32', cvv: '...', bank: 'VISA' }
    // ]);

    const { width } = Dimensions.get('window');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header Decoration */}
                <View style={styles.headerDecoration} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>My Cards</Text>
                        <Text style={styles.headerSubtitle}>Total {cards.length} cards</Text>
                    </View>

                    {/* Only show + button if cards exist */}
                    {cards.length > 0 ? (
                        <TouchableOpacity style={styles.addButton} onPress={() => onNavigate('add-card')}>
                            <Feather name="plus" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 44 }} /> // Spacer to keep title centered
                    )}
                </View>

                {cards.length === 0 ? (
                    /* Empty State */
                    <View style={styles.emptyStateContainer}>
                        <View style={styles.emptyIconContainer}>
                            <MaterialCommunityIcons name="credit-card-outline" size={40} color="#F97316" />
                        </View>
                        <Text style={styles.emptyTitle}>No Cards Yet</Text>
                        <Text style={styles.emptySubtitle}>Add your first card to get started</Text>

                        <TouchableOpacity style={styles.addFirstCardButton} onPress={() => onNavigate('add-card')}>
                            <Feather name="plus" size={18} color="#FFFFFF" />
                            <Text style={styles.addFirstCardText}>Add Your First Card</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Content State */
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>

                        {/* Tip Banner */}
                        <View style={styles.tipBanner}>
                            <Feather name="info" size={14} color="#2563EB" />
                            <Text style={styles.tipText}>Tip: Click any card detail to copy it.</Text>
                        </View>

                        {/* Debit Cards Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Debit Cards</Text>
                                <View style={styles.badge}><Text style={styles.badgeText}>{cards.filter(c => c.type === 'debit').length} cards</Text></View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                                {cards.filter(c => c.type === 'debit').map(card => (
                                    <View key={card.id} style={styles.cardContainer}>
                                        <LinearGradient
                                            colors={['#FB923C', '#EA580C']} // Orange
                                            style={styles.cardGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.cardTopRow}>
                                                <View style={styles.cardActions}>
                                                    <View style={[styles.actionIcon, { marginRight: 8 }]}><Feather name="edit-2" size={12} color="#FFFFFF" opacity={0.8} /></View>
                                                    <View style={[styles.actionIcon, { marginRight: 8 }]}><Feather name="trash-2" size={12} color="#FFFFFF" opacity={0.8} /></View>
                                                    <View style={styles.actionIcon}><Feather name="share-2" size={12} color="#FFFFFF" opacity={0.8} /></View>
                                                </View>
                                                <View style={styles.cardBrand}><Text style={styles.brandText}>{card.bank}</Text></View>
                                            </View>

                                            <View style={styles.cardBody}>
                                                <Text style={styles.cardLabel}>APEKSHA VERMA</Text>
                                                <Text style={styles.cardNumber}>{card.number}</Text>
                                            </View>

                                            <View style={styles.cardFooter}>
                                                <View>
                                                    <Text style={styles.footerLabel}>CARD HOLDER</Text>
                                                    <Text style={styles.footerValue}>{card.holder}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.footerLabel}>EXPIRES</Text>
                                                    <Text style={styles.footerValue}>{card.expiry}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.footerLabel}>CVV</Text>
                                                    <Text style={styles.footerValue}>•••</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Pagination Dots (Mock) */}
                        <View style={styles.pagination}>
                            <View style={[styles.dot, styles.activeDot, { backgroundColor: '#F97316' }]} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>


                        {/* Credit Cards Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Credit Cards</Text>
                                <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}><Text style={[styles.badgeText, { color: '#0284C7' }]}>{cards.filter(c => c.type === 'credit').length} cards</Text></View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                                {cards.filter(c => c.type === 'credit').map(card => (
                                    <View key={card.id} style={styles.cardContainer}>
                                        <LinearGradient
                                            colors={['#F43F5E', '#BE123C']} // Rose/Red
                                            style={styles.cardGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.cardTopRow}>
                                                <View style={styles.cardActions}>
                                                    <View style={[styles.actionIcon, { marginRight: 8 }]}><Feather name="edit-2" size={12} color="#FFFFFF" opacity={0.8} /></View>
                                                    <View style={[styles.actionIcon, { marginRight: 8 }]}><Feather name="trash-2" size={12} color="#FFFFFF" opacity={0.8} /></View>
                                                    <View style={styles.actionIcon}><Feather name="share-2" size={12} color="#FFFFFF" opacity={0.8} /></View>
                                                </View>
                                                <View style={styles.cardBrand}><Text style={styles.brandText}>{card.bank}</Text></View>
                                            </View>

                                            <View style={styles.cardBody}>
                                                <Text style={styles.cardLabel}>APEKSHA VERMA</Text>
                                                <Text style={styles.cardNumber}>{card.number}</Text>
                                            </View>

                                            <View style={styles.cardFooter}>
                                                <View>
                                                    <Text style={styles.footerLabel}>CARD HOLDER</Text>
                                                    <Text style={styles.footerValue}>{card.holder}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.footerLabel}>EXPIRES</Text>
                                                    <Text style={styles.footerValue}>{card.expiry}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.footerLabel}>CVV</Text>
                                                    <Text style={styles.footerValue}>•••</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Pagination Dots (Mock) */}
                        <View style={styles.pagination}>
                            <View style={[styles.dot, styles.activeDot, { backgroundColor: '#F97316' }]} />
                            <View style={styles.dot} />
                        </View>

                    </ScrollView>
                )}

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
        backgroundColor: '#FFF7ED', // Orange 50
    },
    headerDecoration: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#FFEDD5', // Orange 100
        opacity: 0.8,
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
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F97316', // Orange 500
        borderRadius: 12,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: -60, // Visual balance
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#FFEDD5', // Orange 100
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
    },
    addFirstCardButton: {
        flexDirection: 'row',
        backgroundColor: '#F97316', // Orange 500
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    addFirstCardText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // Content Styles
    contentContainer: {
        paddingBottom: 100,
    },
    tipBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        marginHorizontal: 24,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginBottom: 24,
        gap: 8,
    },
    tipText: {
        fontSize: 12,
        color: '#1E40AF',
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
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
        fontWeight: '700',
        color: '#0F172A',
    },
    badge: {
        backgroundColor: '#DCFCE7', // Light green
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#15803D',
    },
    cardsScroll: {
        paddingHorizontal: 24,
        gap: 16,
    },
    cardContainer: {
        width: 300,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 16,
    },
    cardGradient: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardActions: {
        flexDirection: 'row',
    },
    actionIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBrand: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    brandText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
    cardBody: {
        marginTop: 10,
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardNumber: {
        color: 'white',
        fontSize: 22,
        fontWeight: '600',
        letterSpacing: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    footerLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 8,
        fontWeight: '600',
        marginBottom: 2,
    },
    footerValue: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E2E8F0',
    },
    activeDot: {
        width: 16,
    },

    // Global Bottom Nav
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
