import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firestoreService } from './services/firestoreService';

interface AddFriendScreenProps {
    onBack: () => void;
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile') => void;
    userId?: string;
}

export default function AddFriendScreen({ onBack, onNavigate, userId }: AddFriendScreenProps) {
    const [searchId, setSearchId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [foundUser, setFoundUser] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const handleSearch = async () => {
        if (!searchId.trim()) {
            Alert.alert('Input Required', 'Please enter a User ID.');
            return;
        }

        if (searchId.trim() === userId) {
            Alert.alert('Action Not Allowed', 'You cannot be added as a friend in your list.');
            setSearchId(''); // Clear input
            return;
        }

        setIsLoading(true);
        try {
            // 1. Check if user exists
            const user = await firestoreService.getUserProfile(searchId.trim());

            if (user) {
                // 2. Check if already a friend
                if (userId) {
                    const alreadyFriend = await firestoreService.checkFriendExists(userId, user.uid || searchId.trim());
                    if (alreadyFriend) {
                        setIsLoading(false);
                        Alert.alert('Already Added', 'This user is already in your trusted circle.');
                        setSearchId(''); // Clear input
                        return;
                    }
                }

                setIsLoading(false);
                setFoundUser(user);
                setShowConfirmModal(true);
            } else {
                setIsLoading(false);
                Alert.alert('Not Found', 'No user found with this ID.');
            }
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to search user.');
        }
    };

    const handleConfirmAdd = async () => {
        if (!userId || !foundUser) return;

        setIsAdding(true);
        try {
            // Add friend logic
            // We store minimal details: uid, name, photo
            await firestoreService.addFriend(userId, foundUser.uid || foundUser.id || searchId, foundUser);

            setIsAdding(false);
            setShowConfirmModal(false);
            Alert.alert('Success', `${foundUser.fullName || 'User'} has been added to your circle!`);
            onBack(); // Go back to friends list
        } catch (error) {
            setIsAdding(false);
            Alert.alert('Error', 'Failed to add friend.');
        }
    };

    const handleTextChange = (text: string) => {
        // Firebase UIDs are typically alphanumeric (base64-ish chars)
        // We strip out any whitespace or special symbol that shouldn't be there
        const sanitized = text.replace(/[^a-zA-Z0-9]/g, '');
        setSearchId(sanitized);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#FFF5F9', '#FFFFFF']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.addFriendHeaderRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Friend</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.addFriendContent}>
                    <View style={styles.centerIconContainer}>
                        <View style={[styles.blobFloating, { top: 40, left: -100, width: 18, height: 18, backgroundColor: '#F472B6' }]} />
                        <View style={[styles.blobFloating, { top: 100, left: -80, width: 24, height: 24, backgroundColor: '#FBCFE8' }]} />
                        <View style={[styles.blobFloating, { top: -20, right: -90, width: 20, height: 20, backgroundColor: '#FBCFE8' }]} />

                        <LinearGradient
                            colors={['#F472B6', '#EC4899']}
                            style={styles.centerIconGradient}
                        >
                            <Feather name="user-plus" size={32} color="#FFFFFF" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.connectTitle}>Connect with People</Text>
                    <Text style={styles.connectSubtitle}>
                        Paste a User ID below to find and add them to your secure circle.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>User ID</Text>
                        <View style={styles.textInputWrapper}>
                            <TextInput
                                placeholder="e.g. 5x8s..."
                                placeholderTextColor="#94A3B8"
                                style={styles.textInput}
                                value={searchId}
                                onChangeText={handleTextChange}
                                autoCapitalize="none"
                                maxLength={28}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSearch} disabled={isLoading}>
                        <LinearGradient
                            colors={['#F472B6', '#DB2777']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Find User</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Confirmation Bottom Sheet */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showConfirmModal}
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowConfirmModal(false)} />

                    <View style={styles.modalContent}>
                        {/* Handle Bar */}
                        <View style={styles.handleBar} />

                        <View style={styles.avatarContainer}>
                            {foundUser?.photoURL ? (
                                <Image source={{ uri: foundUser.photoURL }} style={styles.modalAvatar} />
                            ) : (
                                <View style={[styles.modalAvatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Feather name="user" size={40} color="#94A3B8" />
                                </View>
                            )}
                        </View>

                        <Text style={styles.modalQuestion}>
                            Looks like a solid match.{"\n\n"}
                            Add <Text style={{ fontWeight: '800', color: '#0F172A' }}>{foundUser?.fullName || foundUser?.name || foundUser?.displayName || 'this user'}</Text> to your secure circle?
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowConfirmModal(false)}
                                disabled={isAdding}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleConfirmAdd}
                                disabled={isAdding}
                            >
                                {isAdding ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 20 }} />
                    </View>
                </View>
            </Modal>

            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('dashboard')}>
                        <Ionicons name="home-outline" size={24} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navItemActive}>
                        <FontAwesome5 name="user-friends" size={16} color="#FFFFFF" />
                        <Text style={styles.navTextActive}>Friends</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('profile')}>
                        <Ionicons name="person-outline" size={24} color="#94A3B8" />
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
    addFriendHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 20,
        width: '100%',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    backButton: {
        width: 40,
        height: 40,
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
    addFriendContent: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        paddingTop: 40,
    },
    centerIconContainer: {
        marginBottom: 32,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    blobFloating: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.6,
    },
    connectTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    connectSubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
        marginLeft: 4,
    },
    textInputWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#0F172A',
        // fontFamily: 'Inter_400Regular'
    },
    submitButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        // fontFamily: 'Inter_700Bold'
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
        backgroundColor: '#EC4899',
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    handleBar: {
        width: 40,
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        marginBottom: 20,
    },
    avatarContainer: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    modalAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    modalName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
        textAlign: 'center',
    },
    modalId: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        fontFamily: 'monospace', // Monospace for ID
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden'
    },
    modalQuestion: {
        fontSize: 16,
        color: '#334155',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F1F5F9',
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 16,
    },
    confirmButton: {
        backgroundColor: '#EC4899',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
