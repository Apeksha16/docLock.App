import React from 'react';
import { Pressable, StatusBar, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Modal, ActivityIndicator } from 'react-native';
import { FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { format } from 'date-fns';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import AddFriendScreen from './AddFriendScreen';
import { firestoreService } from './services/firestoreService';

interface FriendsScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile') => void;
    userId?: string;
}

export default function FriendsScreen({ onNavigate, userId }: FriendsScreenProps) {
    // const { width } = useWindowDimensions();

    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const [showAddFriend, setShowAddFriend] = React.useState(false);
    const [friends, setFriends] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Modal State
    const [selectedFriend, setSelectedFriend] = React.useState<any>(null);
    const [isRemoveModalVisible, setRemoveModalVisible] = React.useState(false);
    const [isRequestDocVisible, setRequestDocVisible] = React.useState(false);
    const [isRequestCardVisible, setRequestCardVisible] = React.useState(false);

    // Request Input State
    const [requestItemName, setRequestItemName] = React.useState('');
    const [isProcessing, setIsProcessing] = React.useState(false);

    const openRemoveModal = (friend: any) => {
        setSelectedFriend(friend);
        setRemoveModalVisible(true);
    };

    const openRequestDocModal = (friend: any) => {
        setSelectedFriend(friend);
        setRequestItemName('');
        setRequestDocVisible(true);
    };

    const openRequestCardModal = (friend: any) => {
        setSelectedFriend(friend);
        setRequestItemName('');
        setRequestCardVisible(true);
    };

    const handleRemoveFriend = async () => {
        if (!selectedFriend || !userId) return;
        setIsProcessing(true);
        try {
            await firestoreService.deleteFriend(userId, selectedFriend.id);
            // Update local state
            setFriends(prev => prev.filter(f => f.id !== selectedFriend.id));
            setRemoveModalVisible(false);
        } catch (error) {
            console.error("Failed to remove friend", error);
        } finally {
            setIsProcessing(false);
            setSelectedFriend(null);
        }
    };

    const handleSendRequest = async (type: 'document' | 'card') => {
        if (!selectedFriend || !userId || !requestItemName.trim()) return;
        setIsProcessing(true);
        try {
            await firestoreService.sendRequest(userId, selectedFriend.id, type, requestItemName);
            if (type === 'document') setRequestDocVisible(false);
            else setRequestCardVisible(false);
        } catch (error) {
            console.error("Failed to send request", error);
        } finally {
            setIsProcessing(false);
            setSelectedFriend(null);
            setRequestItemName('');
        }
    };

    // Fetch friends on mount
    React.useEffect(() => {
        if (!userId) return;
        const fetchFriends = async () => {
            try {
                const data = await firestoreService.getFriends(userId);
                setFriends(data);
            } catch (error) {
                console.error("Failed to fetch friends", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFriends();
    }, [userId, showAddFriend]); // Refetch when coming back from Add Friend

    const handleAddFriend = () => {
        // Button Scale Animation
        scale.value = withSequence(
            withTiming(0.95, { duration: 100 }),
            withSpring(1, { damping: 10, stiffness: 100 })
        );

        // Icon Rotation Animation (Spin 360)
        rotation.value = withSequence(
            withTiming(360, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
            withTiming(0, { duration: 0 }) // Reset instantly for next time
        );

        // Wait for animation then change view
        setTimeout(() => {
            setShowAddFriend(true);
        }, 300);
    };

    if (showAddFriend) {
        return <AddFriendScreen onBack={() => { setShowAddFriend(false); }} onNavigate={onNavigate} userId={userId} />;
    }

    const filteredFriends = friends.filter(f =>
        f.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={['#FFF5F9', '#FFFFFF']} // Very light pink to white
                style={styles.background}
            />

            {/* Top Right Decoration */}
            <View style={styles.headerDecoration} />

            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Trusted Circle</Text>
                    <Text style={styles.headerSubtitle}>{friends.length} secure connections</Text>

                    {/* Add Button Logic: If friends > 0, show small add button here? Or keep main button? 
                        The screenshot shows a generic page, but usually adding is crucial.
                        Let's put a small add button in header if populated.
                    */}
                    {friends.length > 0 && (
                        <TouchableOpacity
                            style={styles.headerAddButton}
                            onPress={() => setShowAddFriend(true)}
                        >
                            <Feather name="plus" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Dashboard Content if Friends Exist */}
                {friends.length > 0 ? (
                    <View style={styles.dashboardContent}>
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search your trusted circle..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Stats Cards Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <View style={[styles.statIconBox, { backgroundColor: '#E0E7FF' }]}>
                                    <Feather name="file-text" size={20} color="#6366F1" />
                                </View>
                                <Text style={styles.statNumber}>0</Text>
                                <Text style={styles.statLabel}>Documents{'\n'}Shared</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={[styles.statIconBox, { backgroundColor: '#FCE7F3' }]}>
                                    <Feather name="credit-card" size={20} color="#EC4899" />
                                </View>
                                <Text style={styles.statNumber}>0</Text>
                                <Text style={styles.statLabel}>Cards{'\n'}Shared</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                                    <Feather name="send" size={20} color="#10B981" />
                                </View>
                                <Text style={styles.statNumber}>0</Text>
                                <Text style={styles.statLabel}>Active{'\n'}Requests</Text>
                            </View>
                        </View>

                        {/* Friends List */}
                        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                            {filteredFriends.map((friend) => (
                                <View key={friend.id} style={styles.friendCard}>
                                    <View style={styles.friendHeader}>
                                        <View style={styles.friendAvatar}>
                                            {friend.photoURL ? (
                                                <Image source={{ uri: friend.photoURL }} style={styles.avatarImage} />
                                            ) : (
                                                <View style={[styles.avatarImage, { backgroundColor: '#EC4899', justifyContent: 'center', alignItems: 'center' }]}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                                                        {(friend.fullName || friend.name || '?')[0].toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.friendName}>{friend.fullName || friend.name || 'Unknown'}</Text>
                                            <Text style={styles.friendDate}>Added {friend.addedAt ? format(new Date(friend.addedAt), 'MMM d, yyyy') : 'Recently'}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => openRemoveModal(friend)}
                                        >
                                            <Feather name="trash-2" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.friendActions}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#FFF5F9' }]}
                                            onPress={() => openRequestDocModal(friend)}
                                        >
                                            <Feather name="file" size={16} color="#EC4899" />
                                            <Text style={[styles.actionText, { color: '#EC4899' }]}>Request Doc</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#ECFDF5' }]}
                                            onPress={() => openRequestCardModal(friend)}
                                        >
                                            <Feather name="credit-card" size={16} color="#10B981" />
                                            <Text style={[styles.actionText, { color: '#10B981' }]}>Request Card</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                    </View>
                ) : (
                    /* Main Content (Centered Empty State) */
                    <View style={styles.content}>
                        {/* Illustration Icon */}
                        <View style={styles.illustrationContainer}>
                            {/* Decorative background blobs */}
                            <View style={styles.blobMedium} />
                            <View style={styles.blobSmall} />

                            {/* Main Box */}
                            <LinearGradient
                                colors={['#FCE7F3', '#FBCFE8']}
                                style={styles.iconBox}
                            >
                                <FontAwesome5 name="user-friends" size={48} color="#EC4899" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>Build Your Circle</Text>
                        <Text style={styles.description}>
                            Connect with trusted friends and family to securely share important documents and cards.
                        </Text>

                        <AnimatedPressable
                            style={[styles.addButton, animatedButtonStyle]}
                            onPress={handleAddFriend}
                        >
                            <LinearGradient
                                colors={['#EC4899', '#DB2777']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.addButtonGradient}
                            >
                                <Animated.View style={animatedIconStyle}>
                                    <Feather name="plus" size={20} color="#FFFFFF" />
                                </Animated.View>
                                <Text style={styles.addButtonText}>Add Your First Friend</Text>
                            </LinearGradient>
                        </AnimatedPressable>
                    </View>
                )}

                {/* --- MODALS --- */}

                {/* Remove Friend Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isRemoveModalVisible}
                    onRequestClose={() => setRemoveModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setRemoveModalVisible(false)} />
                        <View style={styles.modalBottomSheet}>
                            <View style={styles.modalHandle} />

                            <View style={[styles.modalIconContainer, { backgroundColor: '#FEE2E2' }]}>
                                <Feather name="trash-2" size={24} color="#EF4444" />
                            </View>

                            <Text style={styles.modalTitle}>Remove from Circle?</Text>
                            <Text style={styles.modalSubtitle}>
                                Are you sure you want to remove <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedFriend?.fullName || selectedFriend?.name}</Text> from your secure circle?
                            </Text>
                            <Text style={styles.modalWarning}>
                                They will lose access to all shared documents immediately.
                            </Text>

                            <TouchableOpacity
                                style={[styles.modalMainButton, { backgroundColor: '#EF4444' }]}
                                onPress={handleRemoveFriend}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Feather name="trash-2" size={18} color="white" />
                                        <Text style={styles.modalMainButtonText}>Yes, Remove</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setRemoveModalVisible(false)}
                                disabled={isProcessing}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Request Document Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isRequestDocVisible}
                    onRequestClose={() => setRequestDocVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setRequestDocVisible(false)} />
                        <View style={styles.modalBottomSheet}>
                            <View style={styles.modalHandle} />

                            <View style={[styles.modalIconContainer, { backgroundColor: '#FCE7F3' }]}>
                                <Feather name="file-text" size={24} color="#EC4899" />
                            </View>

                            <Text style={styles.modalTitle}>Request Document</Text>
                            <Text style={styles.modalSubtitle}>
                                Send a secure request to <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedFriend?.fullName || selectedFriend?.name}</Text>
                            </Text>

                            <View style={{ width: '100%', marginBottom: 24 }}>
                                <Text style={styles.inputLabel}>What are you looking for?</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="e.g. Passport, Insurance Policy, Driver License"
                                    placeholderTextColor="#94A3B8"
                                    value={requestItemName}
                                    onChangeText={setRequestItemName}
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.modalMainButton,
                                    { backgroundColor: requestItemName.trim() ? '#EC4899' : '#CBD5E1' }
                                ]}
                                onPress={() => handleSendRequest('document')}
                                disabled={!requestItemName.trim() || isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color={requestItemName.trim() ? "white" : "#0F172A"} />
                                ) : (
                                    <Text style={[
                                        styles.modalMainButtonText,
                                        { color: requestItemName.trim() ? 'white' : '#475569' }
                                    ]}>
                                        Send Request
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setRequestDocVisible(false)}
                                disabled={isProcessing}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Request Card Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isRequestCardVisible}
                    onRequestClose={() => setRequestCardVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setRequestCardVisible(false)} />
                        <View style={styles.modalBottomSheet}>
                            <View style={styles.modalHandle} />

                            <View style={[styles.modalIconContainer, { backgroundColor: '#FCE7F3' }]}>
                                <Feather name="credit-card" size={24} color="#EC4899" />
                            </View>

                            <Text style={styles.modalTitle}>Request Card</Text>
                            <Text style={styles.modalSubtitle}>
                                Send a secure request to <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedFriend?.fullName || selectedFriend?.name}</Text>
                            </Text>

                            <View style={{ width: '100%', marginBottom: 24 }}>
                                <Text style={styles.inputLabel}>What are you looking for?</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="e.g. Credit Card, Debit Card, ID Card"
                                    placeholderTextColor="#94A3B8"
                                    value={requestItemName}
                                    onChangeText={setRequestItemName}
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.modalMainButton,
                                    { backgroundColor: requestItemName.trim() ? '#EC4899' : '#CBD5E1' }
                                ]}
                                onPress={() => handleSendRequest('card')}
                                disabled={!requestItemName.trim() || isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color={requestItemName.trim() ? "white" : "#0F172A"} />
                                ) : (
                                    <Text style={[
                                        styles.modalMainButtonText,
                                        { color: requestItemName.trim() ? 'white' : '#475569' }
                                    ]}>
                                        Send Request
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setRequestCardVisible(false)}
                                disabled={isProcessing}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>

            {/* Bottom Navigation Bar */}
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
        backgroundColor: '#FCE7F3', // Light pink
        opacity: 0.6,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 60,
    },
    addFriendHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 20,
        width: '100%', // Ensure it takes full width
    },
    blobFloating: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.6,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: 20,
    },
    illustrationContainer: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    iconBox: {
        width: 120,
        height: 120,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
        zIndex: 10,
    },
    blobMedium: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FCE7F3',
        zIndex: 5,
    },
    blobSmall: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FCE7F3',
        zIndex: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 40,
        maxWidth: 280,
    },
    addButton: {
        width: '100%',
        height: 56,
        borderRadius: 16, // Changed from 28 to match rounded rectangle design
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    addButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16, // Changed from 28
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
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
        backgroundColor: '#EC4899', // Pink
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
    // Dashboard Styles
    dashboardContent: {
        flex: 1,
        paddingHorizontal: 24,
    },
    headerAddButton: {
        position: 'absolute',
        right: 24,
        top: 0,
        backgroundColor: '#EC4899',
        padding: 8,
        borderRadius: 12,
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // Changed to White
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#0F172A',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        marginHorizontal: 4,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 14,
        fontWeight: '500',
    },
    friendCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    friendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    friendAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    friendDate: {
        fontSize: 12,
        color: '#94A3B8',
    },
    deleteButton: {
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
    },
    friendActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', // Align to bottom
    },
    modalBottomSheet: { // Renamed from modalContainer
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 }, // Shadow upwards
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        paddingBottom: 40, // Extra padding for safe area
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#CBD5E1',
        borderRadius: 2,
        marginBottom: 24,
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 4,
    },
    modalWarning: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    modalInput: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#0F172A',
    },
    modalMainButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    modalMainButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    modalCancelButton: {
        paddingVertical: 12,
    },
    modalCancelButtonText: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 16,
    },
});
