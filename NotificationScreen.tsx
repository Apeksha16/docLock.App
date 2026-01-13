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
                    <View style={[styles.iconContainer, { backgroundColor: item.color || '#E0E7FF' }]}>
                        {item.type === 'security' ? (
                            <Feather name="lock" size={20} color={item.iconColor || '#4F46E5'} />
                        ) : item.type === 'qr' ? (
                            <MaterialCommunityIcons name="qrcode" size={20} color={item.iconColor || '#4F46E5'} />
                        ) : item.type === 'document' ? (
                            <Feather name="file-text" size={20} color={item.iconColor || '#4F46E5'} />
                        ) : (
                            <Feather name="bell" size={20} color={item.iconColor || '#4F46E5'} />
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
            console.error("Failed to toggle read status:", error);
        }
    };

    // Helper: Delete
    const handleDelete = async (id: string) => {
        if (!userId) return;
        try {
            await notificationService.deleteNotification(userId, id);
        } catch (error) {
            console.error("Failed to delete notification:", error);
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
                colors={['#F3E8FF', '#FFFFFF']}
                style={StyleSheet.absoluteFillObject}
            />
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
        backgroundColor: '#FFFFFF', // Fallback
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        // Transparent background to let gradient show
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
        flexGrow: 1,
    },
    emptyScrollContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100, // Visual centering adjustment
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12, // margin handled by card for spacing
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#6B21A8', // Purple shadow
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05, // Much softer
        shadowRadius: 16,
        elevation: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
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
        color: '#0F172A',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94A3B8',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F43F5E', // Rose 500
    },
    cardDescription: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9', // Slate 100
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800', // Extra bold
        color: '#0F172A',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        zIndex: 50,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        alignItems: 'center',
        paddingBottom: 40,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        marginBottom: 20,
    },
    confirmIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 24, // Squared circle
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    sheetSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
        textAlign: 'center',
    },
    clearConfirmButton: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: 16, // Rounded button
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    clearConfirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cancelButton: {
        paddingVertical: 8,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    leftAction: {
        backgroundColor: '#7C3AED', // Violet 600
        justifyContent: 'center',
        alignItems: 'flex-start', // Icon on left
        paddingLeft: 32,
        flex: 1,
        borderRadius: 20,
        marginBottom: 12,
    },
    rightAction: {
        backgroundColor: '#EF4444', // Red 500
        justifyContent: 'center',
        alignItems: 'flex-end', // Icon on right
        paddingRight: 32,
        flex: 1,
        borderRadius: 20,
        marginBottom: 12,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'transparent',
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 50, // Pill shape
        borderWidth: 1,
        borderColor: '#7C3AED', // Violet border
        gap: 6,
    },
    shareText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7C3AED',
    },
});
