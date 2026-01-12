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
    deleteDoc,
    addDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { loggerService } from "./loggerService";
import { encryptionService } from "./encryptionService";

// Helper to update parent folder's item count text
const updateParentMetaCount = async (userId: string, parentId: string | null, incrementBy: number) => {
    if (!parentId) return;
    try {
        const parentRef = doc(db, "users", userId, "documents", parentId);
        const parentSnap = await getDoc(parentRef);

        if (parentSnap.exists()) {
            const data = parentSnap.data();
            let currentCount = 0;

            // Parse existing "X items" string
            if (data.meta && typeof data.meta === 'string' && data.meta.includes('items')) {
                const parts = data.meta.split(' ');
                currentCount = parseInt(parts[0], 10);
                if (isNaN(currentCount)) currentCount = 0;
            }

            const newCount = Math.max(0, currentCount + incrementBy);

            await updateDoc(parentRef, {
                meta: `${newCount} items`
            });
        }
    } catch (error) {
        console.error('Failed to update parent folder count:', error);
    }
};

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
    },

    /**
     * Subscribe to documents for a specific folder level (Realtime)
     */
    subscribeToDocuments: (userId: string, parentId: string | null, onUpdate: (docs: any[]) => void) => {
        loggerService.logRequest('firestoreService.subscribeToDocuments', { userId, parentId });
        const docsRef = collection(db, "users", userId, "documents");
        const q = query(docsRef, where("parentId", "==", parentId), where("deleted", "!=", true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            loggerService.logResponse('firestoreService.subscribeToDocuments', { count: documents.length });
            onUpdate(documents);
        }, (error) => {
            loggerService.logApiError('firestoreService.subscribeToDocuments', error);
        });
        return unsubscribe;
    },

    /**
     * Rename a document or folder
     */
    renameDocument: async (userId: string, docId: string, newName: string) => {
        try {
            loggerService.logRequest('firestoreService.renameDocument', { userId, docId, newName });
            const docRef = doc(db, "users", userId, "documents", docId);
            await updateDoc(docRef, {
                name: newName,
                updatedAt: new Date().toISOString()
            });
            loggerService.logResponse('firestoreService.renameDocument', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.renameDocument', error);
            throw error;
        }
    },

    /**
     * Get documents for a specific folder level
     */
    getDocuments: async (userId: string, parentId: string | null) => {
        try {
            loggerService.logRequest('firestoreService.getDocuments', { userId, parentId });
            const docsRef = collection(db, "users", userId, "documents");
            const q = query(docsRef, where("parentId", "==", parentId), where("deleted", "!=", true)); // Basic soft-delete support
            const snapshot = await getDocs(q);

            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            loggerService.logResponse('firestoreService.getDocuments', { count: documents.length });
            return documents;
        } catch (error) {
            loggerService.logApiError('firestoreService.getDocuments', error);
            throw error;
        }
    },

    /**
     * Create a new folder
     */
    createFolder: async (userId: string, name: string, parentId: string | null) => {
        try {
            loggerService.logRequest('firestoreService.createFolder', { userId, name, parentId });
            const docsRef = collection(db, "users", userId, "documents");
            await addDoc(docsRef, {
                type: 'folder',
                name: name,
                parentId: parentId || null, // Ensure null if undefined
                createdAt: new Date().toISOString(),
                meta: '0 items',
                deleted: false
            });

            // Update parent folder count
            if (parentId) {
                await updateParentMetaCount(userId, parentId, 1);
            }

            loggerService.logResponse('firestoreService.createFolder', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.createFolder', error);
            throw error;
        }
    },

    /**
     * Save document metadata (after upload)
     */
    saveDocumentMetadata: async (userId: string, data: { name: string, type?: string, size: number, meta: string, downloadURL: string, parentId: string | null }) => {
        try {
            loggerService.logRequest('firestoreService.saveDocumentMetadata', { userId, data });
            const docsRef = collection(db, "users", userId, "documents");

            // Atomic operations: Add doc + Increment count
            const { writeBatch, increment } = await import("firebase/firestore");
            const batch = writeBatch(db);

            const newDocRef = doc(docsRef); // Generate ID

            batch.set(newDocRef, {
                type: data.type || 'file',
                name: data.name,
                parentId: data.parentId || null, // Ensure null if undefined
                meta: data.meta,
                size: data.size, // Store actual bytes if passed
                downloadURL: data.downloadURL,
                createdAt: new Date().toISOString(),
                deleted: false
            });

            // Increment user's document count
            const userRef = doc(db, "users", userId);
            batch.update(userRef, {
                documentsCount: increment(1)
            });

            await batch.commit();

            // Update parent folder count (separate op)
            if (data.parentId) {
                await updateParentMetaCount(userId, data.parentId, 1);
            }

            loggerService.logResponse('firestoreService.saveDocumentMetadata', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.saveDocumentMetadata', error);
            throw error;
        }
    },

    /**
     * Delete document (soft delete)
     */
    deleteDocument: async (userId: string, docId: string) => {
        try {
            loggerService.logRequest('firestoreService.deleteDocument', { userId, docId });
            const docRef = doc(db, "users", userId, "documents", docId);

            // Check if it's already deleted to avoid double decrement if called multiple times (optional safety)
            // For now, simpler implementation assuming UI handles single click

            const { writeBatch, increment } = await import("firebase/firestore");
            const batch = writeBatch(db);

            batch.update(docRef, { deleted: true });

            // Decrement user's document count
            const userRef = doc(db, "users", userId);
            batch.update(userRef, {
                documentsCount: increment(-1)
            });

            await batch.commit();

            // Find parentId to update count? 
            // Limitation: deleteDocument doesn't take parentId. We need to fetch it first or pass it.
            // For now, let's update deleteDocument signature or fetch the doc.
            // Fetching doc is safer to know the parent.

            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const docData = docSnap.data();
                if (docData.parentId) {
                    await updateParentMetaCount(userId, docData.parentId, -1);
                }
            }

            loggerService.logResponse('firestoreService.deleteDocument', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.deleteDocument', error);
            throw error;
        }
    },

    /**
     * Add a new secure card
     */
    addCard: async (userId: string, cardData: any) => {
        try {
            console.log("DEBUG: addCard called", { userId, cardType: cardData?.cardType });

            if (!userId) {
                throw new Error("addCard: userId is missing");
            }

            loggerService.logRequest('firestoreService.addCard', { userId, cardType: cardData.cardType });

            // 1. Encrypt Sensitive Data
            console.log("DEBUG: Encrypting data...");
            const encryptedCard = {
                ...cardData,
                cardNumber: encryptionService.encryptData(String(cardData.cardNumber || '')),
                cvv: encryptionService.encryptData(String(cardData.cvv || '')),
                expiry: encryptionService.encryptData(String(cardData.expiry || '')),
                // Keep some fields plaintext for use if needed
                cardNumberMasked: String(cardData.cardNumber || '').slice(-4),
                createdAt: new Date().toISOString()
            };
            console.log("DEBUG: Encryption done. Saving...");

            const cardsRef = collection(db, "users", userId, "cards");
            await addDoc(cardsRef, encryptedCard);

            loggerService.logResponse('firestoreService.addCard', { success: true });
        } catch (error) {
            console.error("DEBUG: addCard error", error);
            loggerService.logApiError('firestoreService.addCard', error);
            throw error;
        }
    },

    /**
     * Get user cards
     */
    getCards: async (userId: string) => {
        try {
            loggerService.logRequest('firestoreService.getCards', { userId });
            const cardsRef = collection(db, "users", userId, "cards");
            const q = query(cardsRef); // Add orderBy if needed
            const snapshot = await getDocs(q);

            const cards = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            loggerService.logResponse('firestoreService.getCards', { count: cards.length });
            return cards;
        } catch (error) {
            loggerService.logApiError('firestoreService.getCards', error);
            throw error;
        }
    }
};
