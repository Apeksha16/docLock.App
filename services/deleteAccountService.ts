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

            const subcollections = ['notifications', 'docs', 'cards', 'qrs'];

            for (const sub of subcollections) {
                const path = `users/${userId}/${sub}`;
                await firestoreService.deleteCollection(path);
            }

            await storageService.deleteAllUserFiles(userId);
            await firestoreService.deleteUserDocument(userId);

            if (currentUser) {
                try {
                    const auth = (await import('@react-native-firebase/auth')).default();
                    await currentUser.delete();
                    loggerService.logResponse('deleteAccountService.deleteUserAccount', { authDeleted: true });
                } catch (authError: any) {
                    loggerService.logApiError('deleteAccountService.deleteUserAccount_Auth', authError);
                    if (authError.code === 'auth/requires-recent-login') {
                        throw new Error('Please re-login to verify your identity before deleting your account.');
                    }
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
