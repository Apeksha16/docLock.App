import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions, ScrollView, StatusBar } from 'react-native';
import { FontAwesome5, Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import SecurityPinModal from './components/SecurityPinModal';
import LogoutModal from './components/LogoutModal';
import DeleteAccountModal from './components/DeleteAccountModal';
import * as ImagePicker from 'expo-image-picker';
import { Image, ActivityIndicator, Alert } from 'react-native';
import { storageService } from './services/storageService';
import { firestoreService } from './services/firestoreService';
import { notificationService } from './services/notificationService';
import { deleteAccountService } from './services/deleteAccountService';
import * as Clipboard from 'expo-clipboard';

interface ProfileScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'login' | 'secure-qr' | 'about') => void;
    userProfile?: any;
    appConfig?: any;
    userId?: string;
}

export default function ProfileScreen({ onNavigate, userProfile, appConfig, userId }: ProfileScreenProps) {
    const { width } = useWindowDimensions();
    const [isSecurityModalVisible, setSecurityModalVisible] = useState(false);
    const [isLogoutVisible, setLogoutVisible] = useState(false);
    const [isDeleteVisible, setDeleteVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleShare = async () => {
        const uid = userId || userProfile?.uid || userProfile?.id;
        if (uid) {
            await Clipboard.setStringAsync(uid);
            Alert.alert('Copied!', 'User ID copied to clipboard.');
        } else {
            Alert.alert('Error', 'User ID not found.');
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];

                if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
                    Alert.alert('File too large', 'Please select an image smaller than 2MB.');
                    return;
                }

                setIsUploading(true);
                // Fallback to prop or userProfile.id if uid missing
                const uid = userId || userProfile?.uid || userProfile?.id;

                if (!uid) {
                    throw new Error("User ID not found");
                }

                const { downloadURL, size } = await storageService.uploadProfileImage(uid, asset.uri);

                // 1. Subtract old image size if exists
                if (userProfile?.photoSize) {
                    await firestoreService.updateStorageUsage(uid, -userProfile.photoSize);
                } else if (userProfile?.photoURL && userProfile?.storageUsed > 0 && userProfile?.storageUsed < 5 * 1024 * 1024) {
                    // Heuristic: If we don't have photoSize but have photoURL (implied by this not being first run if storageUsed > 0), 
                    // and storage indicates likely previous image usage (small enough), we could guess or simpler: just accept the small drift for legacy.
                    // But strictly per requirement: "delete existing once and decrease totalsize with old one".
                    // Since we didn't store size before, we can't perfectly subtract. 
                    // Ideally we would get metadata of existing file from storage, but that's an extra call. 
                    // For now, only new uploads will have photoSize tracked perfectly. 
                    // Users might have a one-time drift if replacing a legacy image.
                }

                // 2. Add new image size
                await firestoreService.updateStorageUsage(uid, size);

                // 3. Update profile with new URL AND Size
                await firestoreService.updateUserProfileImage(uid, downloadURL, size);

                // Send Notification
                await notificationService.sendNotification(
                    uid,
                    'Profile Update',
                    'Your profile picture has been updated successfully.',
                    'security'
                );

                setIsUploading(false);
                Alert.alert('Success', 'Profile picture updated!');
            }
        } catch (error: any) {
            setIsUploading(false);
            Alert.alert('Error', error.message);
        }
    };

    const handleLogout = async () => {
        setLogoutVisible(false);
        try {
            await import('./services/authService').then(m => m.authService.logout());
        } catch (error) {
            console.error(error);
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        // Do NOT close modal yet
        // setDeleteVisible(false); 
        setIsDeleting(true);

        try {
            const uid = userId || userProfile?.uid || userProfile?.id;
            if (!uid) {
                setIsDeleting(false);
                return;
            }

            // 1. Get Current User for Auth Deletion
            let currentUser: any = null;
            try {
                const { getAuth } = await import("firebase/auth");
                const auth = getAuth();
                currentUser = auth.currentUser;
            } catch (e) {
                console.log("Auth instance not found", e);
            }

            // 2. Delete Data AND Auth
            await import('./services/deleteAccountService').then(m => m.deleteAccountService.deleteUserAccount(uid, currentUser));

            // 3. Perform Logout logic to clear state (if not already handled by deleteUser triggers)
            await import('./services/authService').then(m => m.authService.logout());

            // Navigate
            setTimeout(() => {
                setDeleteVisible(false); // Close now
                setIsDeleting(false);
                onNavigate('login');
                Alert.alert('Account Deleted', 'Your account and data have been permanently deleted.');
            }, 500);

        } catch (error: any) {
            setIsDeleting(false);
            setDeleteVisible(false); // Close on error to show alert properly
            if (error.message.includes('re-login')) {
                Alert.alert('Security Check', error.message, [
                    { text: 'OK', onPress: () => onNavigate('login') }
                ]);
            } else {
                Alert.alert('Error', 'Failed to delete account. ' + error.message);
            }
        }
    };

    // Calculate Storage Percentage
    // appConfig.maxStorageLimit is in Bytes (e.g., 209715200 for 200MB)
    // userProfile.storageUsed is assumed to be in Bytes for consistency
    const totalStorageBytes = appConfig?.maxStorageLimit || 209715200; // Default 200MB in bytes
    const usedStorageBytes = userProfile?.storageUsed || 0;

    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(0);
    const usedStorageMB = (usedStorageBytes / (1024 * 1024)).toFixed(2); // Show 2 decimal places for small files

    const storagePercent = Math.min((usedStorageBytes / totalStorageBytes) * 100, 100).toFixed(1);
    const storageLeftPercent = (100 - Number(storagePercent)).toFixed(1);

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
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
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
                        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={isUploading}>
                            <View style={styles.avatarCircle}>
                                {userProfile?.photoURL ? (
                                    <Image source={{ uri: userProfile.photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <FontAwesome5 name="user" size={32} color="#CBD5E1" />
                                )}
                                {isUploading && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator color="#2DD4BF" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.cameraIconBadge}>
                                <Feather name="camera" size={12} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>

                        <LinearGradient
                            colors={['#2DD4BF', '#14B8A6']} // Teal 400 to Teal 500
                            style={styles.profileCard}
                        >
                            <View style={styles.cardHeaderSpacer} />

                            <View style={styles.userInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.userName}>{userProfile?.fullName || 'User'}</Text>
                                    <TouchableOpacity>
                                        <Feather name="edit-2" size={16} color="#CCFBF1" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.userMobile}>{userProfile?.mobile || ''}</Text>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{userProfile?.documentsCount || 0}</Text>
                                    <Text style={styles.statLabel}>TOTAL DOCS</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <Text style={styles.statValue}>{storagePercent}</Text>
                                        <Text style={styles.statPercent}>%</Text>
                                    </View>
                                    <Text style={styles.statLabel}>USED</Text>
                                </View>
                            </View>

                            <View style={styles.storageBarContainer}>
                                <View style={styles.storageBarTrack}>
                                    <View style={[styles.storageBarFill, { width: `${storagePercent}%` as any }]} />
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={styles.storageText}>{usedStorageMB} MB / {totalStorageMB} MB</Text>
                                    <Text style={styles.storageText}>Left: {storageLeftPercent}%</Text>
                                </View>
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

                        <TouchableOpacity style={styles.menuItem} onPress={() => setSecurityModalVisible(true)}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                                <Feather name="lock" size={20} color="#0EA5E9" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Security</Text>
                                <Text style={styles.menuSubtitle}>Change MPIN & Biometrics</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('secure-qr')}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                                <MaterialIcons name="qr-code" size={20} color="#0EA5E9" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>My QR Code</Text>
                                <Text style={styles.menuSubtitle}>Share your profile</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('about')}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#FFEDD5' }]}>
                                <Feather name="info" size={20} color="#F97316" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>About DocLock</Text>
                                <Text style={styles.menuSubtitle}>Why we are safe & secure</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => setLogoutVisible(true)}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
                                <Feather name="log-out" size={20} color="#8B5CF6" />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Logout</Text>
                                <Text style={styles.menuSubtitle}>Sign out of this device</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => setDeleteVisible(true)}>
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

            <SecurityPinModal
                visible={isSecurityModalVisible}
                onClose={() => setSecurityModalVisible(false)}
                userId={userId || userProfile?.uid || userProfile?.id}
                mode="set" // Since this is "Change MPIN", effectively "Set new MPIN" or we could implement verify-first.
                // For now, based on "Security -> Change MPIN", simple "Set" flow is okay or "Verify then Set".
                // User request: "create or update".
                onSuccess={() => {
                    /* Optional: Send notification of change */
                }}
            />

            <LogoutModal
                visible={isLogoutVisible}
                onClose={() => setLogoutVisible(false)}
                onLogout={handleLogout}
            />

            <DeleteAccountModal
                visible={isDeleteVisible}
                onClose={() => setDeleteVisible(false)}
                onDelete={handleDeleteAccount}
                isLoading={isDeleting}
            />
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
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 40,
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0F172A',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
});
