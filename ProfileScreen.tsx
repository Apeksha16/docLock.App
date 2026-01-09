import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions, ScrollView, StatusBar } from 'react-native';
import { FontAwesome5, Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProfileScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'login') => void;
}

export default function ProfileScreen({ onNavigate }: ProfileScreenProps) {
    const { width } = useWindowDimensions();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={['#F0FDFA', '#FFFFFF']} // Teal 50 to White
                style={styles.background}
            />

            {/* Top Right Decoration */}
            <View style={styles.headerDecoration} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header - Fixed */}
                <View style={styles.header}>
                    <View style={{ width: 40 }} />
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <TouchableOpacity style={styles.shareButton}>
                        <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Profile Card */}
                    <View style={styles.profileCardContainer}>
                        {/* Avatar (Floating above card) */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarCircle}>
                                <FontAwesome5 name="user" size={32} color="#CBD5E1" />
                            </View>
                        </View>

                        <LinearGradient
                            colors={['#2DD4BF', '#14B8A6']} // Teal 400 to Teal 500
                            style={styles.profileCard}
                        >
                            <View style={styles.cardHeaderSpacer} />

                            <View style={styles.userInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.userName}>APEKSHA Verma</Text>
                                    <TouchableOpacity>
                                        <Feather name="edit-2" size={16} color="#CCFBF1" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.userMobile}>7668804527</Text>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>3</Text>
                                    <Text style={styles.statLabel}>TOTAL DOCS</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <Text style={styles.statValue}>0.5</Text>
                                        <Text style={styles.statPercent}>%</Text>
                                    </View>
                                    <Text style={styles.statLabel}>USED</Text>
                                </View>
                            </View>

                            <View style={styles.storageBarContainer}>
                                <View style={styles.storageBarTrack}>
                                    <View style={[styles.storageBarFill, { width: '0.5%' }]} />
                                </View>
                                <Text style={styles.storageText}>Storage Left: 99.5%</Text>
                            </View>

                            {/* Decorative dots */}
                            <View style={[styles.dotDecoration, { top: 16, right: 16, opacity: 0.3 }]} />
                            <View style={[styles.dotDecoration, { top: 120, right: 16, width: 4, height: 4, opacity: 0.5 }]} />
                            <View style={[styles.dotDecoration, { bottom: 16, left: 16, width: 6, height: 6, opacity: 0.3 }]} />

                        </LinearGradient>
                    </View>

                    <Text style={styles.sectionTitle}>SETTINGS</Text>

                    {/* Menu Items */}
                    <View style={styles.menuContainer}>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                                <Feather name="lock" size={20} color="#0EA5E9" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Security</Text>
                                <Text style={styles.menuSubtitle}>Change MPIN & Biometrics</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                                <MaterialIcons name="qr-code" size={20} color="#0EA5E9" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>My QR Code</Text>
                                <Text style={styles.menuSubtitle}>Share your profile</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#FFEDD5' }]}>
                                <Feather name="info" size={20} color="#F97316" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>About DocLock</Text>
                                <Text style={styles.menuSubtitle}>Why we are safe & secure</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('login')}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
                                <Feather name="log-out" size={20} color="#8B5CF6" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Logout</Text>
                                <Text style={styles.menuSubtitle}>Sign out of this device</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                                <Feather name="trash-2" size={20} color="#EF4444" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Delete Account</Text>
                                <Text style={styles.menuSubtitle}>Permanently remove your account</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('dashboard')}>
                        <Ionicons name="home-outline" size={24} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('friends')}>
                        <FontAwesome5 name="user-friends" size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navItemActive}>
                        <FontAwesome5 name="user" size={16} color="#FFFFFF" />
                        <Text style={styles.navTextActive}>Profile</Text>
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
    safeArea: {
        flex: 1,
    },
    headerDecoration: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#CCFBF1', // Teal 100
        opacity: 0.6,
    },
    scrollContent: {
        paddingBottom: 180, // Increased to ensure bottom items clear the floating nav bar
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 10,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#2DD4BF', // Teal 400
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2DD4BF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    profileCardContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    avatarContainer: {
        zIndex: 10,
        marginBottom: -40, // Pull down into card
        elevation: 10,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9', // Slate 100
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        paddingTop: 0, // Space for avatar handled by spacer
        position: 'relative',
    },
    cardHeaderSpacer: {
        height: 40, // Space for the half-avatar
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    userMobile: {
        fontSize: 14,
        color: '#CCFBF1', // Teal 100
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    statItem: {
        alignItems: 'center',
        minWidth: 80,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statPercent: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 6,
        marginLeft: 2,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#CCFBF1',
        letterSpacing: 1,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 20,
    },
    storageBarContainer: {
        width: '100%',
    },
    storageBarTrack: {
        height: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 3,
        marginBottom: 8,
    },
    storageBarFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
    },
    storageText: {
        fontSize: 10,
        color: '#CCFBF1',
        textAlign: 'right',
        fontWeight: '600',
    },
    dotDecoration: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        marginLeft: 24,
        marginBottom: 16,
        letterSpacing: 1,
    },
    menuContainer: {
        paddingHorizontal: 24,
        gap: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 2,
    },
    menuIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#64748B',
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
        alignItems: 'center',
    },
    navItem: {
        padding: 10,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2DD4BF', // Teal 400
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
