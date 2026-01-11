import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    deleteDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { loggerService } from "./loggerService";

export const firestoreService = {
    /**
     * Save or update user profile data
     */
    saveUserProfile: async (uid: string, data: any) => {
        try {
            loggerService.logRequest('firestoreService.saveUserProfile', { uid, data });
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, {
                ...data,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            loggerService.logResponse('firestoreService.saveUserProfile', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.saveUserProfile', error);
            throw error;
        }
    },

    /**
     * Fetch user profile data
     */
    getUserProfile: async (uid: string) => {
        try {
            loggerService.logRequest('firestoreService.getUserProfile', { uid });
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                const userProfile = { uid: userSnap.id, id: userSnap.id, ...data };
                loggerService.logResponse('firestoreService.getUserProfile', { found: true, data: userProfile });
                return userProfile;
            }
            loggerService.logResponse('firestoreService.getUserProfile', { found: false });
            return null;
        } catch (error) {
            loggerService.logApiError('firestoreService.getUserProfile', error);
            throw error;
        }
    },

    /**
     * Generic function to add a document to a collection
     */
    addDocument: async (collectionName: string, docId: string, data: any) => {
        try {
            loggerService.logRequest(`firestoreService.addDocument(${collectionName})`, { docId, data });
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, {
                ...data,
                createdAt: new Date().toISOString()
            });
            loggerService.logResponse(`firestoreService.addDocument(${collectionName})`, { success: true });
        } catch (error) {
            loggerService.logApiError(`firestoreService.addDocument(${collectionName})`, error);
            throw error;
        }
    },
    /**
     * Check if a user with the given mobile number exists
     */
    checkUserExistsByMobile: async (mobileNumber: string) => {
        try {
            loggerService.logRequest('firestoreService.checkUserExistsByMobile', { mobileNumber });

            // Normalize inputs to check both formats (with and without +91)
            const cleanNumber = mobileNumber.replace(/\D/g, '').slice(-10); // Last 10 digits
            const formattedNumber = `+91${cleanNumber}`;

            const usersRef = collection(db, "users");
            // Check for EITHER raw 10 digits OR +91 format
            const q = query(usersRef, where("mobile", "in", [cleanNumber, formattedNumber]));

            const querySnapshot = await getDocs(q);
            const exists = !querySnapshot.empty;
            loggerService.logResponse('firestoreService.checkUserExistsByMobile', { exists, checked: [cleanNumber, formattedNumber] });
            return exists;
        } catch (error) {
            loggerService.logApiError('firestoreService.checkUserExistsByMobile', error);
            throw error;
        }
    },

    /**
     * Realtime subscription to user profile
     */
    subscribeToUserProfile: (uid: string, onUpdate: (data: any) => void) => {
        loggerService.logRequest('firestoreService.subscribeToUserProfile', { uid });
        const userRef = doc(db, "users", uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                loggerService.logResponse('firestoreService.subscribeToUserProfile', { update: true });
                onUpdate(data);
            } else {
                loggerService.logResponse('firestoreService.subscribeToUserProfile', { exists: false });
                onUpdate(null);
            }
        }, (error) => {
            loggerService.logApiError('firestoreService.subscribeToUserProfile', error);
        });
        return unsubscribe;
    },

    /**
     * Fetch global app configuration
     */
    getAppConfig: async () => {
        try {
            loggerService.logRequest('firestoreService.getAppConfig');
            const docRef = doc(db, "app_config", "global");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                loggerService.logResponse('firestoreService.getAppConfig', data);
                return data;
            } else {
                loggerService.logResponse('firestoreService.getAppConfig', { exists: false });
                return null;
            }
        } catch (error) {
            loggerService.logApiError('firestoreService.getAppConfig', error);
            return null;
        }
    },
    /**
     * Update user storage usage
     */
    updateStorageUsage: async (userId: string, sizeChangeBytes: number) => {
        try {
            loggerService.logRequest('firestoreService.updateStorageUsage', { userId, sizeChangeBytes });
            const userRef = doc(db, "users", userId);

            // We use increment provided by firestore for atomic updates
            const { increment } = await import("firebase/firestore");

            await updateDoc(userRef, {
                storageUsed: increment(sizeChangeBytes)
            });
            loggerService.logResponse('firestoreService.updateStorageUsage', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.updateStorageUsage', error);
            throw error;
        }
    },

    /**
     * Update user profile image URL and size
     */
    updateUserProfileImage: async (userId: string, photoURL: string, photoSize: number = 0) => {
        try {
            loggerService.logRequest('firestoreService.updateUserProfileImage', { userId, photoURL, photoSize });
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                photoURL: photoURL,
                photoSize: photoSize,
                updatedAt: new Date().toISOString()
            });
            loggerService.logResponse('firestoreService.updateUserProfileImage', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.updateUserProfileImage', error);
            throw error;
        }
    },
    /**
     * Update user MPIN (Authenticated action)
     */
    updateUserMpin: async (userId: string, mpinHash: string) => {
        try {
            loggerService.logRequest('firestoreService.updateUserMpin', { userId });
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                mpin: mpinHash,
                updatedAt: new Date().toISOString()
            });
            loggerService.logResponse('firestoreService.updateUserMpin', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.updateUserMpin', error);
            throw error;
        }
    },
    /**
     * Delete a collection (client-side simple batch delete)
     */
    deleteCollection: async (path: string) => {
        try {
            loggerService.logRequest('firestoreService.deleteCollection', { path });
            const colRef = collection(db, path);
            const snapshot = await getDocs(colRef);

            const { writeBatch } = await import("firebase/firestore");
            const batch = writeBatch(db);

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            loggerService.logResponse('firestoreService.deleteCollection', { success: true, count: snapshot.size });
        } catch (error) {
            loggerService.logApiError('firestoreService.deleteCollection', error);
            throw error;
        }
    },

    /**
     * Delete the main user document
     */
    deleteUserDocument: async (userId: string) => {
        try {
            loggerService.logRequest('firestoreService.deleteUserDocument', { userId });
            const userRef = doc(db, "users", userId);
            await deleteDoc(userRef);
            loggerService.logResponse('firestoreService.deleteUserDocument', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.deleteUserDocument', error);
            throw error;
        }
    },

    /**
     * Add a friend to the user's friend list
     */
    addFriend: async (currentUserId: string, friendUserId: string, friendData: any) => {
        try {
            loggerService.logRequest('firestoreService.addFriend', { currentUserId, friendUserId });

            // Reference to the new friend document in the 'friends' subcollection
            const friendRef = doc(db, "users", currentUserId, "friends", friendUserId);

            // Store minimal friend data
            await setDoc(friendRef, {
                uid: friendUserId,
                fullName: friendData.fullName || 'Unknown',
                photoURL: friendData.photoURL || null,
                mobile: friendData.mobile || null,
                addedAt: new Date().toISOString()
            });

            loggerService.logResponse('firestoreService.addFriend', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.addFriend', error);
            throw error;
        }
    },

    /**
     * Check if a user is already a friend
     */
    checkFriendExists: async (currentUserId: string, friendUserId: string) => {
        try {
            loggerService.logRequest('firestoreService.checkFriendExists', { currentUserId, friendUserId });
            const friendRef = doc(db, "users", currentUserId, "friends", friendUserId);
            const friendSnap = await getDoc(friendRef);
            const exists = friendSnap.exists();
            loggerService.logResponse('firestoreService.checkFriendExists', { exists });
            return exists;
        } catch (error) {
            loggerService.logApiError('firestoreService.checkFriendExists', error);
            throw error;
        }
    }
};
