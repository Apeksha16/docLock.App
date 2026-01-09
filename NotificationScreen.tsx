import React, { useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useWindowDimensions, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeOut, Layout } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NotificationScreenProps {
    onNavigate: (screen: 'dashboard') => void;
}

const initialNotifications = [
    {
        id: '1',
        title: 'Security Update',
        description: 'Your MPIN has been updated successfully.',
        time: '1d ago',
        unread: true,
        type: 'security', // lock icon
        color: '#FEE2E2', // Light Red/Pink bg
        iconColor: '#EF4444' // Red icon
    },
    {
        id: '2',
        title: 'Secure QR Created',
        description: 'Successfully generated secure QR: Id',
        time: '1d ago',
        unread: true,
        type: 'qr', // qr icon
        color: '#FFEDD5', // Light Orange bg
        iconColor: '#F97316' // Orange icon
    },
    {
        id: '3',
        title: 'Security Update',
        description: 'Your MPIN has been updated successfully.',
        time: '1d ago',
        unread: false,
        type: 'security',
        color: '#FEE2E2',
        iconColor: '#EF4444'
    }
];

const NotificationItem = ({ item, onMarkRead, onDelete }: { item: any, onMarkRead: () => void, onDelete: () => void }) => {
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
                        // Swipe Right -> Mark Read
                        onMarkRead();
                        swipeableRef.current?.close();
                    }
                }}
            >
                <View style={styles.card}>
                    <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                        {item.type === 'security' ? (
                            <Feather name="lock" size={20} color={item.iconColor} />
                        ) : (
                            <MaterialCommunityIcons name="qrcode" size={20} color={item.iconColor} />
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <View style={styles.metaContainer}>
                                <Text style={styles.timeText}>{item.time}</Text>
                                {item.unread && <View style={styles.unreadDot} />}
                            </View>
                        </View>
                        <Text style={styles.cardDescription}>{item.description}</Text>
                    </View>
                </View>
            </Swipeable>
        </Animated.View>
    );
};

export default function NotificationScreen({ onNavigate }: NotificationScreenProps) {
    const { width } = useWindowDimensions();
    const [notifications, setNotifications] = React.useState(initialNotifications);
    const [showClearConfirm, setShowClearConfirm] = React.useState(false);

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const confirmClearAll = () => {
        setNotifications([]);
        setShowClearConfirm(false);
    };

    const handleDelete = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleMarkRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={showClearConfirm ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.actionButton}>
                    <Feather name="arrow-left" size={20} color="#64748B" />
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
                            onMarkRead={() => handleMarkRead(item.id)}
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
        backgroundColor: '#F8FAFC', // Very light grey/white background
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
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
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 2,
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
        backgroundColor: '#2DD4BF', // Teal 400 (Theme match)
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
});
