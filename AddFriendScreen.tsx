import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddFriendScreenProps {
    onBack: () => void;
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile') => void;
}

export default function AddFriendScreen({ onBack, onNavigate }: AddFriendScreenProps) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {/* Background Gradient */}
            <LinearGradient
                colors={['#FFF5F9', '#FFFFFF']} // Very light pink to white
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.addFriendHeaderRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Friend</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.addFriendContent}>
                    {/* Center Icon */}
                    <View style={styles.centerIconContainer}>
                        {/* Extra floating blobs for this view */}
                        <View style={[styles.blobFloating, { top: 40, left: -100, width: 18, height: 18, backgroundColor: '#F472B6' }]} />
                        <View style={[styles.blobFloating, { top: 100, left: -80, width: 24, height: 24, backgroundColor: '#FBCFE8' }]} />
                        <View style={[styles.blobFloating, { top: -20, right: -90, width: 20, height: 20, backgroundColor: '#FBCFE8' }]} />

                        <LinearGradient
                            colors={['#F472B6', '#EC4899']}
                            style={styles.centerIconGradient}
                        >
                            <Feather name="user-plus" size={32} color="#FFFFFF" />
                        </LinearGradient>

                        {/* Decorative dots based on image */}
                        <View style={[styles.decorativeDot, { top: 20, left: -60, width: 12, height: 12, backgroundColor: '#F9A8D4' }]} />
                        <View style={[styles.decorativeDot, { top: 60, left: -40, width: 20, height: 20, backgroundColor: '#FBCFE8' }]} />
                        <View style={[styles.decorativeDot, { top: -20, right: -50, width: 16, height: 16, backgroundColor: '#F9A8D4' }]} />
                    </View>

                    <Text style={styles.connectTitle}>Connect with People</Text>
                    <Text style={styles.connectSubtitle}>
                        Paste a User ID or profile link below to add them to your secure circle.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Profile Link or ID</Text>
                        <View style={styles.textInputWrapper}>
                            <TextInput
                                placeholder="e.g. gV5I3sJf..."
                                placeholderTextColor="#94A3B8"
                                style={styles.textInput}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitButton}>
                        <LinearGradient
                            colors={['#F472B6', '#DB2777']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButtonGradient}
                        >
                            <Text style={styles.submitButtonText}>Add Friend</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Decorative Background Elements for Add Friend Page */}
            <View style={styles.topRightDecoration} />
            {/* Additional Sidebar Blobs */}
            <View style={[styles.blobFloating, { position: 'absolute', top: 200, left: -20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FCE7F3', opacity: 0.5 }]} />
            <View style={[styles.blobFloating, { position: 'absolute', top: 350, right: -30, width: 80, height: 80, borderRadius: 40, backgroundColor: '#FCE7F3', opacity: 0.5 }]} />


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
    decorativeDot: {
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
    },
    topRightDecoration: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FCE7F3', // Light Pink
        zIndex: -1,
        opacity: 0.5,
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
});
