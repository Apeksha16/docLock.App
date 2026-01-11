import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    addDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
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
}

export const notificationService = {
    /**
     * Subscribe to realtime notifications for a specific user
     * @param userId The user's ID
     * @param onUpdate Callback function with the list of notifications
     * @returns Unsubscribe function
     */
    subscribeToNotifications: (userId: string, onUpdate: (notifications: Notification[]) => void) => {
        loggerService.logRequest('notificationService.subscribeToNotifications', { userId });

        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifications: Notification[] = [];
            snapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                } as Notification);
            });

            loggerService.logResponse('notificationService.subscribeToNotifications', { count: notifications.length });
            onUpdate(notifications);
        }, (error) => {
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
            const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
            await updateDoc(notifRef, {
                read: !currentStatus
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
            const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
            await deleteDoc(notifRef);
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
            const notificationsRef = collection(db, 'users', userId, 'notifications');
            await addDoc(notificationsRef, {
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
