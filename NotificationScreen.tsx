import React, { useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useWindowDimensions, SafeAreaView, Platform, StatusBar, Share, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeOut, Layout } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { notificationService } from './services/notificationService';

interface NotificationScreenProps {
    onNavigate: (screen: 'dashboard') => void;
    notifications: any[];
    userId?: string;
}

const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 0) return 'Just now';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const TimeAgo = ({ timestamp }: { timestamp: any }) => {
    const [timeString, setTimeString] = React.useState(formatRelativeTime(timestamp));

    React.useEffect(() => {
        // Update immediately
        setTimeString(formatRelativeTime(timestamp));

        // Update every 30 seconds
        const interval = setInterval(() => {
            setTimeString(formatRelativeTime(timestamp));
        }, 30000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <Text style={styles.timeText}>
            {timeString}
        </Text>
    );
};

const NotificationItem = ({ item, onToggleRead, onDelete }: { item: any, onToggleRead: () => void, onDelete: () => void }) => {
    const swipeableRef = useRef<Swipeable>(null);

    const renderRightActions = () => (
        <View style={styles.rightAction}>
            <Feather name="trash-2" size={24} color="#FFFFFF" />
        </View>
    );

    const renderLeftActions = () => (
        <View style={styles.leftAction}>
            <Feather name="check" size={24} color="#FFFFFF" />
        </View>
    );

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this ${item.shareText || 'content'} from DocLock!`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    return (
        <Animated.View layout={Layout.springify()} exiting={FadeOut}>
            <Swipeable
                ref={swipeableRef}
                renderRightActions={renderRightActions}
                renderLeftActions={renderLeftActions}
                onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                        // Swipe Left -> Delete
                        onDelete();
                    } else if (direction === 'left') {
                        // Swipe Right -> Toggle Read
                        onToggleRead();
                        swipeableRef.current?.close();
                    }
                }}
            >
                <View style={[styles.card, item.read && { opacity: 0.7 }]}>
                    <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
                        {item.type === 'security' ? (
                            <Feather name="lock" size={20} color="#7C3AED" />
                        ) : item.type === 'qr' ? (
                            <MaterialCommunityIcons name="qrcode" size={20} color="#F97316" />
                        ) : item.type === 'document' ? (
                            <Feather name="file-text" size={20} color="#0D9488" />
                        ) : (
                            <Feather name="bell" size={20} color="#7C3AED" />
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <View style={styles.metaContainer}>
                                <TimeAgo timestamp={item.timestamp} />
                                {!item.read && <View style={styles.unreadDot} />}
                            </View>
                        </View>
                        <Text style={styles.cardDescription}>{item.message || item.description}</Text>

                        {/* Share Action Button */}
                        {item.canShare && (
                            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                                <Feather name="share-2" size={14} color="#7C3AED" />
                                <Text style={styles.shareText}>Share</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Swipeable>
        </Animated.View>
    );
};

export default function NotificationScreen({ onNavigate, notifications = [], userId }: NotificationScreenProps) {
    const { width } = useWindowDimensions();
    const [showClearConfirm, setShowClearConfirm] = React.useState(false);

    // Filter out deleted notifications locally if needed, but props should update
    const displayNotifications = notifications;

    // Helper: Toggle Read Status
    const handleToggleRead = async (id: string, currentStatus: boolean) => {
        if (!userId) return;
        try {
            await notificationService.toggleReadStatus(userId, id, currentStatus);
        } catch (error) {
            // Error handled by UI
        }
    };

    // Helper: Delete
    const handleDelete = async (id: string) => {
        if (!userId) return;
        try {
            await notificationService.deleteNotification(userId, id);
        } catch (error) {
            // Error handled by UI
        }
    };

    const confirmClearAll = async () => {
        setShowClearConfirm(false);
        if (!userId) return;
        // Optional: Implement delete all
        // For now, delete one by one or add batch delete
        for (const notif of notifications) {
            handleDelete(notif.id);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#F3E8FF', '#FFFFFF']} // Light Purple to White
                style={StyleSheet.absoluteFillObject}
            />

            {/* Decorative Blob */}
            <View style={styles.headerDecoration} />

            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.actionButton}>
                    <Feather name="arrow-left" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, notifications.length === 0 && styles.emptyScrollContainer]} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Feather name="bell" size={24} color="#94A3B8" />
                        </View>
                        <Text style={styles.emptyTitle}>All Caught Up!</Text>
                        <Text style={styles.emptySubtitle}>No new notifications.</Text>
                    </View>
                ) : (
                    notifications.map((item) => (
                        <NotificationItem
                            key={item.id}
                            item={item}
                            onToggleRead={() => handleToggleRead(item.id, item.read)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))
                )}
            </ScrollView>

            {/* Confirmation Bottom Sheet */}
            {showClearConfirm && (
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.backdrop} onPress={() => setShowClearConfirm(false)} activeOpacity={1} />
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHandle} />

                        <View style={styles.confirmIconContainer}>
                            <Feather name="trash-2" size={24} color="#EF4444" />
                        </View>

                        <Text style={styles.sheetTitle}>Clear Notifications?</Text>
                        <Text style={styles.sheetSubtitle}>This will remove all your notifications.</Text>

                        <TouchableOpacity style={styles.clearConfirmButton} onPress={confirmClearAll}>
                            <Feather name="trash-2" size={18} color="#FFFFFF" />
                            <Text style={styles.clearConfirmText}>Clear All</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowClearConfirm(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3E8FF', // Light Purple background
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerDecoration: {
        position: 'absolute',
        top: -100,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#E0E7FF', // Light Indigo/Purple
        opacity: 0.6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.5,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
        flexGrow: 1,
    },
    emptyScrollContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#F8FAFC',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#EDE9FE', // Light Violet
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
        marginRight: 8,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#94A3B8',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F43F5E',
    },
    cardDescription: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        fontWeight: '500',
    },
    // ... empty state and modal styles kept consistent or updated slightly
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
        zIndex: 50,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        alignItems: 'center',
        paddingBottom: 40,
    },
    sheetHandle: {
        width: 48,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#E2E8F0',
        marginBottom: 24,
    },
    confirmIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },
    sheetSubtitle: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 32,
        textAlign: 'center',
    },
    clearConfirmButton: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#EF4444',
        paddingVertical: 18,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    clearConfirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cancelButton: {
        paddingVertical: 10,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    leftAction: {
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 32,
        flex: 1,
        borderRadius: 24,
        marginBottom: 16,
    },
    rightAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 32,
        flex: 1,
        borderRadius: 24,
        marginBottom: 16,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#F5F3FF', // Very light violet bg
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    shareText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7C3AED',
    },
});
