import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, G } from 'react-native-svg';

interface DashboardScreenProps {
    onNavigate: (screen: 'splash' | 'login' | 'signup' | 'otp' | 'notifications' | 'friends' | 'profile' | 'secure-qr' | 'my-cards' | 'add-card' | 'my-documents') => void;
    userProfile?: any;
    notifications?: any[];
    appConfig?: any;
}

export default function DashboardScreen({ onNavigate, userProfile, notifications = [], appConfig }: DashboardScreenProps) {
    const { width } = useWindowDimensions();
    const isTablet = width > 768;

    // --- Storage Stats ---
    const totalStorageBytes = appConfig?.maxStorageLimit || 209715200; // Default 200MB
    const usedStorageBytes = userProfile?.storageUsed || 0;

    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(0);
    const usedStorageMB = (usedStorageBytes / (1024 * 1024)).toFixed(2);
    const storagePercent = Math.min((usedStorageBytes / totalStorageBytes) * 100, 100).toFixed(0);

    // --- Card Stats ---
    const maxCards = appConfig?.maxCreditCardsLimit || 5;
    // In a real app, userProfile might have a cardsCount field too, 
    // or we might calculate it from a cards collection subscribe (not done yet).
    // For now mocking 'cardsCount' from profile or 0.
    const usedCards = userProfile?.cardsCount || 0;
    const cardsPercent = Math.min((usedCards / maxCards) * 100, 100).toFixed(0);

    // --- QR Stats ---
    const maxQrs = 5; // Config didn't show maxQrs limit explicitly in screenshot? 
    // Actually screenshot shows 'qrs' map in app_config structure but expanded 'global'.
    // Assuming 5 for now or check config if it exists.
    const usedQrs = userProfile?.qrsCount || 0;
    const qrsPercent = Math.min((usedQrs / maxQrs) * 100, 100).toFixed(0);


    const [activeTab, setActiveTab] = React.useState<'storage' | 'cards' | 'qrs'>('storage');

    const tabData = {
        storage: {
            label: 'STORAGE',
            percent: Number(storagePercent),
            value: `${usedStorageMB} MB / ${totalStorageMB} MB`,
            used: `${storagePercent}%`,
            color: '#4F46E5', // Indigo
            subLabel: 'STORAGE DETAILS',
            chartLabel: 'STORAGE'
        },
        cards: {
            label: 'CARDS',
            percent: Number(cardsPercent),
            value: `${usedCards} / ${maxCards}`,
            used: `${cardsPercent}%`,
            color: '#EC4899', // Pink
            subLabel: 'CARDS DETAILS',
            chartLabel: 'CARDS'
        },
        qrs: {
            label: 'QRS',
            percent: Number(qrsPercent),
            value: `${usedQrs} / ${maxQrs}`,
            used: `${qrsPercent}%`,
            color: '#F97316', // Orange
            subLabel: 'QRS DETAILS',
            chartLabel: 'QRS'
        }
    };

    const currentData = tabData[activeTab];

    // Chart Configuration
    const size = 260; // Reduced from 300
    const strokeWidth = 25; // Scaled down from 30
    const center = size / 2;

    // Ring Configuration (Radius)
    // Scaled for Size 260.
    // Inner Ring: R=55. Stroke=25. Inner Edge=42.5. Outer Edge=67.5.
    // Middle Ring: R=85. Stroke=25. Inner Edge=72.5. Outer Edge=97.5. Gap = 5.
    // Outer Ring: R=115. Stroke=25. Inner Edge=102.5. Outer Edge=127.5. Gap = 5. fits in 130.

    const rings = [
        { key: 'qrs', radius: 115, color: tabData.qrs.color, percent: tabData.qrs.percent },
        { key: 'storage', radius: 85, color: tabData.storage.color, percent: tabData.storage.percent },
        { key: 'cards', radius: 55, color: tabData.cards.color, percent: tabData.cards.percent },
    ];

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#F0F7FF', '#FFFFFF']}
                style={styles.background}
            />

            {/* Top Curved Decoration */}
            <View style={styles.headerDecoration} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeLabel}>WELCOME BACK,</Text>
                        <Text style={styles.username}>{userProfile?.fullName?.toUpperCase() || 'USER'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => onNavigate('notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                        {notifications.some(n => !n.read) && <View style={styles.badge} />}
                    </TouchableOpacity>
                </View>

                {/* Storage Widget Section */}
                <View style={styles.storageSection}>
                    {/* Concentric Rings Chart Container - Neumorphic Disc */}
                    <View style={styles.chartContainer}>

                        {/* Shadow/Glow Background */}
                        <View style={styles.chartBackground} />

                        <Svg width={size} height={size} style={{ position: 'absolute', zIndex: 10 }}>
                            <G rotation="-90" origin={`${center}, ${center}`}>
                                {rings.map((ring) => {
                                    const circumference = 2 * Math.PI * ring.radius;
                                    const progressStroke = (ring.percent / 100) * circumference;
                                    const isActive = activeTab === ring.key;
                                    const opacity = isActive ? 1 : 0.15; // Highlight logic

                                    return (
                                        <React.Fragment key={ring.key}>
                                            {/* Track (Dimmed) */}
                                            <Circle
                                                cx={center}
                                                cy={center}
                                                r={ring.radius}
                                                stroke={ring.color}
                                                strokeWidth={strokeWidth}
                                                strokeOpacity={0.15} // Always dim track
                                                fill="transparent"
                                            />
                                            {/* Progress (Bright) */}
                                            {ring.percent > 0 && (
                                                <Circle
                                                    cx={center}
                                                    cy={center}
                                                    r={ring.radius}
                                                    stroke={ring.color}
                                                    strokeWidth={strokeWidth}
                                                    fill="transparent"
                                                    strokeDasharray={[circumference]} // Full length
                                                    strokeDashoffset={circumference - progressStroke}
                                                    strokeLinecap="round" // Round caps!
                                                    strokeOpacity={isActive ? 1 : 0.3} // Bright if active
                                                />
                                            )}
                                            {/* Top Dot (Start of Ring) - purely decorative as seen in image */}
                                            <Circle
                                                cx={center + ring.radius}
                                                cy={center}
                                                r={strokeWidth / 2 - 4} // Smaller dot inside
                                                fill={ring.color}
                                            // We need to rotate this dot back to 0 degrees relative to the container rotation (-90)
                                            // Actually, Container is -90. 0 deg is top.
                                            // A simple way is to just render separate dots not in the rotated group or calc pos.
                                            // But drawing a circle at (cx + r, cy) inside this rotated group puts it at 12 o'clock.
                                            />
                                        </React.Fragment>
                                    );
                                })}
                            </G>
                        </Svg>

                        {/* Center Text */}
                        <View style={styles.centerTextContainer}>
                            <Text style={[styles.percentText, { color: currentData.color }]}>{currentData.used}</Text>
                            <Text style={[styles.storageLabel, { color: '#94A3B8' }]}>{currentData.chartLabel}</Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                { backgroundColor: '#EEF2FF', borderColor: activeTab === 'storage' ? '#4F46E5' : 'transparent' }
                            ]}
                            onPress={() => setActiveTab('storage')}
                        >
                            <View style={[styles.dot, { backgroundColor: '#4F46E5' }]} />
                            <Text style={[styles.tabText, { color: '#4F46E5' }]}>Storage</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tab,
                                { backgroundColor: '#FDF2F8', borderColor: activeTab === 'cards' ? '#EC4899' : 'transparent' }
                            ]}
                            onPress={() => setActiveTab('cards')}
                        >
                            <View style={[styles.dot, { backgroundColor: '#EC4899' }]} />
                            <Text style={[styles.tabText, { color: '#EC4899' }]}>Cards</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tab,
                                { backgroundColor: '#FFF7ED', borderColor: activeTab === 'qrs' ? '#F97316' : 'transparent' }
                            ]}
                            onPress={() => setActiveTab('qrs')}
                        >
                            <View style={[styles.dot, { backgroundColor: '#F97316' }]} />
                            <Text style={[styles.tabText, { color: '#F97316' }]}>QRs</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Dynamic Details Card */}
                    <View style={styles.storageCard}>
                        <View>
                            <Text style={styles.cardTitle}>{currentData.subLabel}</Text>
                            <Text style={styles.cardValue}>
                                <Text style={[styles.usedValue, { color: currentData.color }]}>
                                    {activeTab === 'storage' ? '1.01' : currentData.value.split(' / ')[0]}
                                </Text>
                                {activeTab === 'storage' ? ' MB / 200 MB' : ` / ${currentData.value.split(' / ')[1]}`}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardTitle}>USED</Text>
                            <Text style={[styles.percentValueNew, { color: currentData.color }]}>{currentData.used}</Text>
                        </View>
                    </View>
                </View>


                {/* Grid Menu */}
                <View style={styles.gridContainer}>
                    <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('my-documents')}>
                        <View style={[styles.iconBox, { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#4F46E5' }]}>
                            <MaterialCommunityIcons name="file-document-outline" size={24} color="#4F46E5" />
                        </View>
                        <Text style={styles.gridLabel}>Documents</Text>
                        <Text style={styles.gridSubLabel}>{userProfile?.documentsCount || 0} Files</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('my-cards')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FDF2F8', borderWidth: 1, borderColor: '#EC4899' }]}>
                            <MaterialCommunityIcons name="credit-card-outline" size={24} color="#EC4899" />
                        </View>
                        <Text style={styles.gridLabel}>Cards</Text>
                        <Text style={styles.gridSubLabel}>0 Active</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('secure-qr')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#F97316' }]}>
                            <MaterialCommunityIcons name="qrcode" size={24} color="#F97316" />
                        </View>
                        <Text style={styles.gridLabel}>QRs</Text>
                        <Text style={styles.gridSubLabel}>Synced</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    headerDecoration: {
        position: 'absolute',
        top: -150,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#E0E7FF', // Light purple/blue
        opacity: 0.5,
    },
    scrollContent: {
        paddingTop: 50, // Reduced from 60
        paddingHorizontal: 24,
        paddingBottom: 120, // Increased to ensure last item clears the floating bar if scrolling happens
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20, // Reduced from 40
    },
    welcomeLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    username: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A', // Dark Slate
        letterSpacing: -0.5,
    },
    notificationButton: {
        width: 44,
        height: 44,
        backgroundColor: '#7C3AED', // Violet 600
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#6366F1',
    },
    storageSection: {
        alignItems: 'center',
        marginBottom: 20, // Reduced from 40
    },
    chartContainer: {
        width: 260,
        height: 260,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    chartBackground: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: '#FFFFFF',
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10,
    },
    centerTextContainer: {
        position: 'absolute',
        zIndex: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentText: {
        fontSize: 32, // Reduced from 36
        fontWeight: '900',
        marginBottom: -4,
    },
    storageLabel: {
        fontSize: 10, // Reduced from 12
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    percentValueNew: {
        fontSize: 18,
        fontWeight: '800',
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16, // Reduced from 24
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1.5,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    storageCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#94A3B8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    cardValue: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    usedValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4F46E5',
    },
    percentValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4F46E5',
    },
    gridContainer: {
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'space-between',
    },
    gridItem: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F8FAFC',
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    gridSubLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '500',
    },
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
