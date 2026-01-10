import React from 'react';
import { Pressable, StatusBar, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import AddFriendScreen from './AddFriendScreen';

interface FriendsScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile') => void;
}

export default function FriendsScreen({ onNavigate }: FriendsScreenProps) {
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
        return <AddFriendScreen onBack={() => setShowAddFriend(false)} onNavigate={onNavigate} />;
    }


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
                    <Text style={styles.headerSubtitle}>0 secure connections</Text>
                </View>

                {/* Main Content (Centered) */}
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
});
