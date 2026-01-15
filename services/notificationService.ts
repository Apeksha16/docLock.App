// @ts-ignore
import firestore from '@react-native-firebase/firestore';
import { loggerService } from './loggerService';

export interface Notification {
    id: string;
    title: string;
    message: string;
    icon: string;
    read: boolean;
    timestamp: number;
    createdAt: string;
    metadata?: any;
    iconColor?: string;
    color?: string;
}

export const notificationService = {
    /**
     * Subscribe to realtime notifications for a specific user
     */
    subscribeToNotifications: (userId: string, onUpdate: (notifications: Notification[]) => void) => {
        loggerService.logRequest('notificationService.subscribeToNotifications', { userId });
        const notifsRef = firestore().collection('users').doc(userId).collection('notifications');
        const q = notifsRef.orderBy('timestamp', 'desc');

        const unsubscribe = q.onSnapshot((snapshot: any) => {
            const notifications = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            })) as Notification[];
            loggerService.logResponse('notificationService.subscribeToNotifications', { count: notifications.length });
            onUpdate(notifications);
        }, (error: any) => {
            loggerService.logApiError('notificationService.subscribeToNotifications', error);
        });
        return unsubscribe;
    },

    /**
     * Toggle a notification as read/unread
     */
    toggleReadStatus: async (userId: string, notificationId: string, currentStatus: boolean) => {
        try {
            loggerService.logRequest('notificationService.toggleReadStatus', { userId, notificationId, newStatus: !currentStatus });
            const notifRef = firestore().collection('users').doc(userId).collection('notifications').doc(notificationId);
            await notifRef.update({
                read: !currentStatus,
            });
            loggerService.logResponse('notificationService.toggleReadStatus', { success: true });
        } catch (error) {
            loggerService.logApiError('notificationService.toggleReadStatus', error);
            throw error;
        }
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (userId: string, notificationId: string) => {
        try {
            loggerService.logRequest('notificationService.deleteNotification', { userId, notificationId });
            const notifRef = firestore().collection('users').doc(userId).collection('notifications').doc(notificationId);
            await notifRef.delete();
            loggerService.logResponse('notificationService.deleteNotification', { success: true });
        } catch (error) {
            loggerService.logApiError('notificationService.deleteNotification', error);
            throw error;
        }
    },

    /**
     * Send a notification to a specific user
     */
    sendNotification: async (userId: string, title: string, message: string, type: string = 'info', iconColor: string = '#4F46E5', color: string = '#E0E7FF') => {
        try {
            loggerService.logRequest('notificationService.sendNotification', { userId, title });
            const notificationsRef = firestore().collection('users').doc(userId).collection('notifications');

            await notificationsRef.add({
                title,
                message,
                type,
                read: false,
                timestamp: Date.now(),
                createdAt: new Date().toISOString(),
                iconColor,
                color
            });

            loggerService.logResponse('notificationService.sendNotification', { success: true });
        } catch (error) {
            loggerService.logApiError('notificationService.sendNotification', error);
            throw error;
        }
    }
};
