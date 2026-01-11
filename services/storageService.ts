import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "../firebaseConfig";
import { loggerService } from "./loggerService";

const storage = getStorage(app);

export const storageService = {
    /**
     * Upload a profile image to Firebase Storage
     * @param userId User ID
     * @param uri Local file URI
     * @returns Object containing downloadURL and size in bytes
     */
    uploadProfileImage: async (userId: string, uri: string): Promise<{ downloadURL: string, size: number }> => {
        try {
            loggerService.logRequest('storageService.uploadProfileImage', { userId });

            const response = await fetch(uri);
            const blob = await response.blob();
            const size = blob.size;

            // Validate size (2MB = 2 * 1024 * 1024 bytes)
            if (size > 2 * 1024 * 1024) {
                throw new Error("Image size exceeds 2MB limit.");
            }

            const storageRef = ref(storage, `users/${userId}/profile.jpg`);

            // Upload
            await uploadBytes(storageRef, blob);

            // Get URL
            const downloadURL = await getDownloadURL(storageRef);

            loggerService.logResponse('storageService.uploadProfileImage', { success: true, size });
            return { downloadURL, size };
        } catch (error) {
            loggerService.logApiError('storageService.uploadProfileImage', error);
            throw error;
        }
    },

    /**
     * Delete profile image from Firebase Storage
     * @param userId User ID
     */
    deleteProfileImage: async (userId: string) => {
        try {
            loggerService.logRequest('storageService.deleteProfileImage', { userId });
            const storageRef = ref(storage, `users/${userId}/profile.jpg`);
            await deleteObject(storageRef);
            loggerService.logResponse('storageService.deleteProfileImage', { success: true });
        } catch (error: any) {
            // Ignore if object not found
            if (error.code !== 'storage/object-not-found') {
                loggerService.logApiError('storageService.deleteProfileImage', error);
                // We don't throw here to avoid blocking profile updates if delete fails
            }
        }
    },

    /**
     * Delete all files in user's storage folder
     */
    deleteAllUserFiles: async (userId: string) => {
        try {
            loggerService.logRequest('storageService.deleteAllUserFiles', { userId });
            const { listAll } = await import("firebase/storage");

            // Delete profile image
            const profileRef = ref(storage, `users/${userId}/profile.jpg`);
            await deleteObject(profileRef).catch(() => { }); // Maintain flow if not found

            // Delete docs in 'docs' folder if any structure exists there, 
            // usually users/{userId}/docs/filename
            // or just list root of users/{userId} and delete everything?
            // Safer to list `users/{userId}` and delete items.

            const userRootRef = ref(storage, `users/${userId}`);

            // Note: Firebase Storage listAll is shallow. If we have nested folders, we need recursion.
            // Assuming simple structure: users/{userId}/profile.jpg and maybe users/{userId}/docs/...

            const listResult = await listAll(userRootRef);

            const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
            await Promise.all(deletePromises);

            // If there are subfolders (prefixes), we should handle them too if we want "complete" wipe.
            // Let's check 'docs' prefix specifically if that's where we store things.
            // Assuming we don't know exact structure, we might need a recursive delete helper.
            // For now, let's just try to be robust for common known paths.

            if (listResult.prefixes.length > 0) {
                for (const folderRef of listResult.prefixes) {
                    const subList = await listAll(folderRef);
                    await Promise.all(subList.items.map(item => deleteObject(item)));
                }
            }

            loggerService.logResponse('storageService.deleteAllUserFiles', { success: true });
        } catch (error) {
            loggerService.logApiError('storageService.deleteAllUserFiles', error);
            // Don't throw, we want to continue deletion of other things
        }
    }
};
