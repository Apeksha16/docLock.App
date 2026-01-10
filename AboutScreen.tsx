import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface AboutScreenProps {
    onNavigate: (screen: 'profile') => void;
}

export default function AboutScreen({ onNavigate }: AboutScreenProps) {
    const { width } = useWindowDimensions();
    const scrollX = React.useRef(new Animated.Value(0)).current;

    const CARD_WIDTH = width * 0.85;
    const CARD_SPACING = 20;
    const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;
    const SPACER_WIDTH = (width - CARD_WIDTH) / 2 - CARD_SPACING; // Centers the card

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => onNavigate('profile')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>About</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroIconContainer}>
                            <View style={styles.heroIconCircle}>
                                <Feather name="lock" size={40} color="#2563EB" />
                            </View>
                            {/* Glow effect */}
                            <View style={styles.heroIconGlow} />
                        </View>
                        <Text style={styles.heroTitle}>Secure. Smart.</Text>
                        <Text style={[styles.heroTitle, { color: '#6366F1' }]}>Simple.</Text>
                        <Text style={styles.heroSubtitle}>
                            Your personal digital fortress. Military-grade encryption meets beautiful design.
                        </Text>
                    </View>

                    <Text style={styles.sectionHeader}>WHY DOCLOCK?</Text>

                    {/* Features Grid */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresScroll}>
                        <View style={styles.featureCard}>
                            <View style={[styles.featureIconBox, { backgroundColor: '#10B981' }]}>
                                <MaterialIcons name="security" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.featureTitle}>Bank-Grade Security</Text>
                            <Text style={styles.featureDesc}>AES-256 encryption ensures your data is yours alone.</Text>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={[styles.featureIconBox, { backgroundColor: '#F59E0B' }]}>
                                <Ionicons name="flash" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.featureTitle}>Instant Access</Text>
                            <Text style={styles.featureDesc}>Find any document in seconds with smart search.</Text>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={[styles.featureIconBox, { backgroundColor: '#3B82F6' }]}>
                                <Ionicons name="cloud-outline" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.featureTitle}>Cloud Sync</Text>
                            <Text style={styles.featureDesc}>Access your files from any device, anywhere.</Text>
                        </View>
                    </ScrollView>

                    <Text style={styles.sectionHeader}>PREMIUM FEATURES</Text>

                    {/* Premium Features Carousel */}
                    <Animated.ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={SNAP_INTERVAL}
                        decelerationRate="fast"
                        contentContainerStyle={{
                            paddingHorizontal: (width - CARD_WIDTH) / 2,
                            paddingBottom: 20,
                            gap: CARD_SPACING
                        }}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: true }
                        )}
                        scrollEventThrottle={16}
                    >
                        {/* Folder Organization - Deep Blue/Indigo */}
                        <View style={{ width: CARD_WIDTH }}>
                            <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.premiumCard}>
                                <Text style={styles.premiumCardTitle}>Folder Organization</Text>
                                <Text style={styles.premiumCardDesc}>Efficient categorization for your files. Store IDs, Medical Records, and more in dedicated folders.</Text>
                                <View style={styles.folderVisual}>
                                    <View style={[styles.miniFolder, { backgroundColor: '#EF4444' }]}><Feather name="heart" size={12} color="#FFF" /></View>
                                    <View style={[styles.miniFolder, { backgroundColor: '#3B82F6' }]}><Feather name="file-text" size={12} color="#FFF" /></View>
                                    <View style={styles.miniBar} />
                                </View>
                            </LinearGradient>
                            {/* Blur Overlay */}
                            <AnimatedBlurView
                                intensity={10}
                                style={[
                                    styles.blurOverlay,
                                    {
                                        opacity: scrollX.interpolate({
                                            inputRange: [-SNAP_INTERVAL, 0, SNAP_INTERVAL],
                                            outputRange: [1, 0, 1],
                                            extrapolate: 'clamp',
                                        })
                                    }
                                ]}
                            />
                        </View>

                        {/* Secure Sharing - Vibrant Teal/Emerald */}
                        <View style={{ width: CARD_WIDTH }}>
                            <LinearGradient colors={['#14B8A6', '#0F766E']} style={styles.premiumCard}>
                                <Text style={styles.premiumCardTitle}>Secure Sharing</Text>
                                <Text style={styles.premiumCardDesc}>Share documents with time-limited links. Control exactly who sees what.</Text>
                                <View style={[styles.shareVisual, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                    <View style={[styles.shareCircle, { backgroundColor: '#FFFFFF' }]}><Text style={{ fontWeight: '700', color: '#0F766E' }}>JD</Text></View>
                                    <View style={[styles.shareBar, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
                                    <Feather name="clock" size={14} color="#FFFFFF" />
                                </View>
                            </LinearGradient>
                            {/* Blur Overlay */}
                            <AnimatedBlurView
                                intensity={10}
                                style={[
                                    styles.blurOverlay,
                                    {
                                        opacity: scrollX.interpolate({
                                            inputRange: [0, SNAP_INTERVAL, SNAP_INTERVAL * 2],
                                            outputRange: [1, 0, 1],
                                            extrapolate: 'clamp',
                                        })
                                    }
                                ]}
                            />
                        </View>

                        {/* Wallet Cards - Rich Violet */}
                        <View style={{ width: CARD_WIDTH }}>
                            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.premiumCard}>
                                <Text style={styles.premiumCardTitle}>Wallet Cards</Text>
                                <Text style={styles.premiumCardDesc}>Save your Debit & Credit cards securely. Copy details with a single tap.</Text>
                                <View style={styles.cardVisual}>
                                    <View style={styles.miniCreditCard} />
                                </View>
                            </LinearGradient>
                            {/* Blur Overlay */}
                            <AnimatedBlurView
                                intensity={10}
                                style={[
                                    styles.blurOverlay,
                                    {
                                        opacity: scrollX.interpolate({
                                            inputRange: [SNAP_INTERVAL, SNAP_INTERVAL * 2, SNAP_INTERVAL * 3],
                                            outputRange: [1, 0, 1],
                                            extrapolate: 'clamp',
                                        })
                                    }
                                ]}
                            />
                        </View>
                    </Animated.ScrollView>


                    <Text style={styles.sectionHeader}>PRO TIPS</Text>

                    <View style={styles.tipsContainer}>
                        {[
                            { title: 'Quick Add', desc: 'Use the floating action button (+) to instantly upload documents or add cards from the dashboard.' },
                            { title: 'Offline Access', desc: 'Your cards are cached locally so you can access them even without internet.' },
                            { title: 'Secure Profile', desc: 'Update your M-PIN regularly in settings to keep your fortress impenetrable.' }
                        ].map((tip, index) => (
                            <View key={index} style={styles.tipRow}>
                                <View style={styles.checkCircle}>
                                    <Feather name="check" size={12} color="#10B981" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tipTitle}>{tip.title}</Text>
                                    <Text style={styles.tipDesc}>{tip.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>


                    <View style={styles.footer}>
                        <Text style={styles.designedBy}>Designed by <Text style={{ color: '#E879F9', fontWeight: '700' }}>Apeksha Verma</Text></Text>
                        <Text style={styles.developedBy}>Developed & Architected by <Text style={{ color: '#6366F1', fontWeight: '700' }}>Pranav Katiyar</Text></Text>

                        <View style={styles.versionContainer}>
                            <Text style={styles.craftedWith}>CRAFTED WITH</Text>
                            <Ionicons name="heart" size={12} color="#EF4444" style={{ marginHorizontal: 4 }} />
                            <Text style={styles.craftedWith}>FOR YOU</Text>
                        </View>
                        <Text style={styles.versionText}>Version 1.0.0</Text>
                    </View>

                    <View style={{ height: 40 }} />

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 30,
        marginVertical: 40,
    },
    heroIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    heroIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        zIndex: 2,
    },
    heroIconGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#3B82F6',
        opacity: 0.1,
        zIndex: 1,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366F1',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    featuresScroll: {
        paddingHorizontal: 24,
        gap: 16,
        paddingBottom: 20,
    },
    featureCard: {
        width: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F8FAFC',
    },
    featureIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    featureDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    premiumContainer: {
        paddingHorizontal: 24,
        gap: 20,
    },
    premiumCard: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        minHeight: 160,
    },
    premiumCardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    premiumCardDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
        maxWidth: '80%',
    },
    folderVisual: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        height: 60,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    miniFolder: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniBar: {
        height: 4,
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
    },
    shareVisual: {
        marginTop: 20,
        backgroundColor: '#F8FAFC',
        height: 60,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    shareCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareBar: {
        height: 6,
        flex: 1,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
    },
    cardVisual: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    miniCreditCard: {
        width: 140,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        transform: [{ rotate: '-5deg' }],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    tipsContainer: {
        paddingHorizontal: 24,
        gap: 24,
    },
    tipRow: {
        flexDirection: 'row',
        gap: 16,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    tipDesc: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    footer: {
        alignItems: 'center',
        marginTop: 60,
    },
    designedBy: {
        fontSize: 14,
        color: '#1E293B',
        marginBottom: 8,
        fontWeight: '500',
    },
    developedBy: {
        fontSize: 14,
        color: '#1E293B',
        marginBottom: 24,
        fontWeight: '500',
    },
    versionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    craftedWith: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 2,
    },
    versionText: {
        fontSize: 12,
        color: '#CBD5E1',
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        overflow: 'hidden',
    },
});
