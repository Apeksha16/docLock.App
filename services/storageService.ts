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

            if (size > 2 * 1024 * 1024) {
                throw new Error("Image size exceeds 2MB limit.");
            }

            const storageRef = ref(storage, `users/${userId}/profile.jpg`);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            loggerService.logResponse('storageService.uploadProfileImage', { success: true, size });
            return { downloadURL, size };
        } catch (error) {
            loggerService.logApiError('storageService.uploadProfileImage', error);
            throw error;
        }
    },

    /**
     * Upload a document to Firebase Storage
     * @param userId User ID
     * @param uri Local file URI
     * @param fileName File name with extension
     * @returns Object containing downloadURL and size in bytes
     */
    uploadFile: async (userId: string, uri: string, fileName: string): Promise<{ downloadURL: string, size: number }> => {
        try {
            loggerService.logRequest('storageService.uploadFile', { userId, fileName });

            const response = await fetch(uri);
            const blob = await response.blob();
            const size = blob.size;

            if (size > 5 * 1024 * 1024) {
                throw new Error("File size exceeds 5MB limit.");
            }

            const uniqueName = `${Date.now()}_${fileName}`;
            const storageRef = ref(storage, `users/${userId}/docs/${uniqueName}`);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            loggerService.logResponse('storageService.uploadFile', { success: true, size });
            return { downloadURL, size };
        } catch (error) {
            loggerService.logApiError('storageService.uploadFile', error);
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
            if (error.code !== 'storage/object-not-found') {
                loggerService.logApiError('storageService.deleteProfileImage', error);
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
            await deleteObject(profileRef).catch(() => { });

            const userRootRef = ref(storage, `users/${userId}`);
            const listResult = await listAll(userRootRef);

            const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
            await Promise.all(deletePromises);

            if (listResult.prefixes.length > 0) {
                for (const folderRef of listResult.prefixes) {
                    const subList = await listAll(folderRef);
                    await Promise.all(subList.items.map(item => deleteObject(item)));
                }
            }

            if (listResult.prefixes.length > 0) {
                for (const folderRef of listResult.prefixes) {
                    const subList = await listAll(folderRef);
                    await Promise.all(subList.items.map(item => deleteObject(item)));
                }
            }

            loggerService.logResponse('storageService.deleteAllUserFiles', { success: true });
        } catch (error) {
            loggerService.logApiError('storageService.deleteAllUserFiles', error);
        }
    }
};
