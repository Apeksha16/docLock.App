import { firestoreService } from './firestoreService';
import { storageService } from './storageService';
import { loggerService } from './loggerService';

export const deleteAccountService = {
    /**
     * Permanently delete user account and all associated data
     * @param userId The ID of the user to delete
     * @param currentUser Optional Firebase User object to delete authentication
     */
    deleteUserAccount: async (userId: string, currentUser?: any) => {
        try {
            loggerService.logRequest('deleteAccountService.deleteUserAccount', { userId, hasUser: !!currentUser });

            // 1. Delete Subcollections (We must know the names)
            // Common subcollections: notifications, docs, cards, qrs
            const subcollections = ['notifications', 'docs', 'cards', 'qrs'];

            for (const sub of subcollections) {
                // Construct path: users/{userId}/{subcollection}
                const path = `users/${userId}/${sub}`;
                await firestoreService.deleteCollection(path);
            }

            // 2. Delete ALL Storage Files (Profile pic, docs, etc.)
            await storageService.deleteAllUserFiles(userId);

            // 3. Delete Main User Document
            await firestoreService.deleteUserDocument(userId);

            // 4. Delete Auth User
            if (currentUser) {
                try {
                    const { deleteUser } = await import("firebase/auth");
                    await deleteUser(currentUser);
                    loggerService.logResponse('deleteAccountService.deleteUserAccount', { authDeleted: true });
                } catch (authError: any) {
                    loggerService.logApiError('deleteAccountService.deleteUserAccount_Auth', authError);
                    if (authError.code === 'auth/requires-recent-login') {
                        throw new Error('Please re-login to verify your identity before deleting your account.');
                    }
                    // For other errors, we might strictly throw or just log.
                    // If data is deleted but auth remains, it's a "partial" state.
                    throw authError;
                }
            }

            loggerService.logResponse('deleteAccountService.deleteUserAccount', { success: true });
        } catch (error) {
            loggerService.logApiError('deleteAccountService.deleteUserAccount', error);
            throw error;
        }
    }
};
