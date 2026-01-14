// @ts-ignore
import firestore from '@react-native-firebase/firestore';
import { loggerService } from "./loggerService";
import { encryptionService } from "./encryptionService";

const updateParentMetaCount = async (userId: string, parentId: string | null, incrementBy: number) => {
    if (!parentId) return;
    try {
        const parentRef = firestore().collection("users").doc(userId).collection("documents").doc(parentId);
        const parentSnap = await parentRef.get();

        if (typeof (parentSnap as any).exists === 'function' ? parentSnap.exists() : parentSnap.exists) {
            const data = parentSnap.data();
            let currentCount = 0;

            if (data?.meta && typeof data.meta === 'string' && data.meta.includes('items')) {
                const parts = data.meta.split(' ');
                currentCount = parseInt(parts[0], 10);
                if (isNaN(currentCount)) currentCount = 0;
            }

            const newCount = Math.max(0, currentCount + incrementBy);

            await parentRef.update({
                meta: `${newCount} items`
            });
        }
    } catch (error) {
        loggerService.logApiError('firestoreService.updateParentMetaCount', error);
    }
};
const addNotificationHelper = async (userId: string, notification: { title: string, message: string, type: 'qr' | 'system' | 'alert' }) => {
    if (!userId) {
        return;
    }
    try {
        const notifRef = firestore().collection("users").doc(userId).collection("notifications");

        await notifRef.add({
            ...notification,
            read: false,
            createdAt: new Date().toISOString(),
            timestamp: Date.now()
        });

        const q = notifRef.orderBy('timestamp', 'desc');
        const snapshot = await q.get();

        if (snapshot.size > 20) {
            const batch = firestore().batch();
            const docsToDelete = snapshot.docs.slice(20);

            docsToDelete.forEach((doc: any) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        }

    } catch (error) {
        loggerService.logApiError('firestoreService.addNotificationHelper', error);
    }
};

export const firestoreService = {
    /**
     * Save or update user profile data
     */
    saveUserProfile: async (uid: string, data: any) => {
        try {
            loggerService.logRequest('firestoreService.saveUserProfile', { uid, data });
            const userRef = firestore().collection("users").doc(uid);
            await userRef.set({
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
            const userRef = firestore().collection("users").doc(uid);
            const userSnap = await userRef.get();
            if (typeof (userSnap as any).exists === 'function' ? userSnap.exists() : userSnap.exists) {
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
            const docRef = firestore().collection(collectionName).doc(docId);
            await docRef.set({
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

            const cleanNumber = mobileNumber.replace(/\D/g, '').slice(-10);
            const formattedNumber = `+91${cleanNumber}`;

            const usersRef = firestore().collection("users");
            const q = usersRef.where("mobile", "in", [cleanNumber, formattedNumber]);

            const querySnapshot = await q.get();
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
        const userRef = firestore().collection("users").doc(uid);
        const unsubscribe = userRef.onSnapshot((doc: any) => {
            if (doc.exists) {
                const data = doc.data();
                loggerService.logResponse('firestoreService.subscribeToUserProfile', { update: true });
                onUpdate(data);
            } else {
                loggerService.logResponse('firestoreService.subscribeToUserProfile', { exists: false });
                onUpdate(null);
            }
        }, (error: any) => {
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
            const docRef = firestore().collection("app_config").doc("global");
            const docSnap = await docRef.get();

            if (typeof (docSnap as any).exists === 'function' ? docSnap.exists() : docSnap.exists) {
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
            const userRef = firestore().collection("users").doc(userId);

            await userRef.update({
                storageUsed: firestore.FieldValue.increment(sizeChangeBytes)
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
            const userRef = firestore().collection("users").doc(userId);
            await userRef.update({
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
            const userRef = firestore().collection("users").doc(userId);
            await userRef.update({
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
            const colRef = firestore().collection(path);
            const snapshot = await colRef.get();

            const batch = firestore().batch();

            snapshot.docs.forEach((doc: any) => {
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
            const userRef = firestore().collection("users").doc(userId);
            await userRef.delete();
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

            const friendRef = firestore().collection("users").doc(currentUserId).collection("friends").doc(friendUserId);

            await friendRef.set({
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
            const friendRef = firestore().collection("users").doc(currentUserId).collection("friends").doc(friendUserId);
            const friendSnap = await friendRef.get();
            const exists = typeof (friendSnap as any).exists === 'function' ? friendSnap.exists() : friendSnap.exists;
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
        const docsRef = firestore().collection("users").doc(userId).collection("documents");
        const q = docsRef.where("parentId", "==", parentId).where("deleted", "!=", true);

        const unsubscribe = q.onSnapshot((snapshot: any) => {
            const documents = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            loggerService.logResponse('firestoreService.subscribeToDocuments', { count: documents.length });
            onUpdate(documents);
        }, (error: any) => {
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
            const docRef = firestore().collection("users").doc(userId).collection("documents").doc(docId);
            await docRef.update({
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
            const docsRef = firestore().collection("users").doc(userId).collection("documents");
            const q = docsRef.where("parentId", "==", parentId).where("deleted", "!=", true);
            const snapshot = await q.get();

            const documents = snapshot.docs.map((doc: any) => ({
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
            const docsRef = firestore().collection("users").doc(userId).collection("documents");
            await docsRef.add({
                type: 'folder',
                name: name,
                parentId: parentId || null,
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
            const docsRef = firestore().collection("users").doc(userId).collection("documents");

            const batch = firestore().batch();

            const newDocRef = docsRef.doc();

            batch.set(newDocRef, {
                type: data.type || 'file',
                name: data.name,
                parentId: data.parentId || null,
                meta: data.meta,
                size: data.size,
                downloadURL: data.downloadURL,
                createdAt: new Date().toISOString(),
                deleted: false
            });

            const userRef = firestore().collection("users").doc(userId);
            batch.update(userRef, {
                documentsCount: firestore.FieldValue.increment(1)
            });

            await batch.commit();

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
            const docRef = firestore().collection("users").doc(userId).collection("documents").doc(docId);

            const batch = firestore().batch();

            batch.update(docRef, { deleted: true });

            const userRef = firestore().collection("users").doc(userId);
            batch.update(userRef, {
                documentsCount: firestore.FieldValue.increment(-1)
            });

            await batch.commit();

            const docSnap = await docRef.get();
            if (typeof (docSnap as any).exists === 'function' ? docSnap.exists() : docSnap.exists) {
                const docData = docSnap.data();
                if (docData?.parentId) {
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
            if (!userId) {
                throw new Error("addCard: userId is missing");
            }

            loggerService.logRequest('firestoreService.addCard', { userId, cardType: cardData?.cardType });

            const encryptedCardNumber = encryptionService.encryptData(String(cardData.cardNumber || ''));
            const encryptedCvv = encryptionService.encryptData(String(cardData.cvv || ''));
            const encryptedExpiry = encryptionService.encryptData(String(cardData.expiry || ''));

            const encryptedCard = {
                ...cardData,
                cardNumber: encryptedCardNumber,
                cvv: encryptedCvv,
                expiry: encryptedExpiry,
                cardNumberMasked: String(cardData.cardNumber || '').slice(-4),
                createdAt: new Date().toISOString()
            };
            const batch = firestore().batch();

            const cardsCollectionRef = firestore().collection("users").doc(userId).collection("cards");
            const newCardRef = cardsCollectionRef.doc();

            batch.set(newCardRef, encryptedCard);

            const userRef = firestore().collection("users").doc(userId);
            batch.update(userRef, {
                cardsCount: firestore.FieldValue.increment(1)
            });

            await batch.commit();

            await addNotificationHelper(userId, {
                title: 'New Card Added',
                message: `A new ${cardData.cardType || 'credit'} card ending in ****${String(cardData.cardNumber || '').slice(-4)} has been added to your vault.`,
                type: 'system'
            });

            loggerService.logResponse('firestoreService.addCard', { success: true });
        } catch (error) {
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
            const cardsRef = firestore().collection("users").doc(userId).collection("cards");
            const snapshot = await cardsRef.get();

            const cards = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));

            loggerService.logResponse('firestoreService.getCards', { count: cards.length });
            return cards;
        } catch (error) {
            loggerService.logApiError('firestoreService.getCards', error);
            throw error;
        }
    },

    /**
     * Subscribe to user's cards (Realtime)
     */
    subscribeToCards: (userId: string, onUpdate: (cards: any[]) => void) => {
        loggerService.logRequest('firestoreService.subscribeToCards', { userId });
        const cardsRef = firestore().collection("users").doc(userId).collection("cards");
        const unsubscribe = cardsRef.onSnapshot((snapshot: any) => {
            const cards = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            loggerService.logResponse('firestoreService.subscribeToCards', { count: cards.length });
            onUpdate(cards);
        }, (error: any) => {
            loggerService.logApiError('firestoreService.subscribeToCards', error);
        });
        return unsubscribe;
    },

    /**
     * Delete a card
     */
    deleteCard: async (userId: string, cardId: string) => {
        try {
            loggerService.logRequest('firestoreService.deleteCard', { userId, cardId });
            const cardRef = firestore().collection("users").doc(userId).collection("cards").doc(cardId);

            const cardSnap = await cardRef.get();
            const exists = typeof (cardSnap as any).exists === 'function' ? cardSnap.exists() : cardSnap.exists;
            const cardData = exists ? cardSnap.data() : null;
            const cardName = cardData?.cardName || 'Card';

            await cardRef.delete();

            await addNotificationHelper(userId, {
                title: 'Card Deleted',
                message: `"${cardName}" has been removed from your vault.`,
                type: 'alert'
            });

            loggerService.logResponse('firestoreService.deleteCard', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.deleteCard', error);
            throw error;
        }
    },

    /**
     * Update a card
     */
    updateCard: async (userId: string, cardId: string, cardData: any) => {
        try {
            loggerService.logRequest('firestoreService.updateCard', { userId, cardId, cardData });
            const cardRef = firestore().collection("users").doc(userId).collection("cards").doc(cardId);

            const updates: any = { ...cardData };

            if (updates.cardNumber) {
                updates.cardNumber = encryptionService.encryptData(String(updates.cardNumber));
                updates.cardNumberMasked = String(cardData.cardNumber).slice(-4);
            }
            if (updates.cvv) {
                updates.cvv = encryptionService.encryptData(String(updates.cvv));
            }
            if (updates.expiry) {
                updates.expiry = encryptionService.encryptData(String(updates.expiry));
            }

            updates.updatedAt = new Date().toISOString();

            await cardRef.set(updates, { merge: true });

            await addNotificationHelper(userId, {
                title: 'Card Updated',
                message: `Card "${cardData.cardName || 'Card'}" has been updated.`,
                type: 'system'
            });

            loggerService.logResponse('firestoreService.updateCard', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.updateCard', error);
            throw error;
        }
    },

    /**
     * Get user friends
     */
    getFriends: async (userId: string) => {
        try {
            loggerService.logRequest('firestoreService.getFriends', { userId });
            const friendsRef = firestore().collection("users").doc(userId).collection("friends");
            const snapshot = await friendsRef.get();

            const friends = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));

            loggerService.logResponse('firestoreService.getFriends', { count: friends.length });
            return friends;
        } catch (error) {
            loggerService.logApiError('firestoreService.getFriends', error);
            throw error;
        }
    },

    /**
     * Get all files (flat list) for selection
     */
    getAllFiles: async (userId: string) => {
        try {
            loggerService.logRequest('firestoreService.getAllFiles', { userId });
            const docsRef = firestore().collection("users").doc(userId).collection("documents");
            const q = docsRef.where("type", "==", "file").where("deleted", "!=", true);
            const snapshot = await q.get();

            const files = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));

            loggerService.logResponse('firestoreService.getAllFiles', { count: files.length });
            return files;
        } catch (error) {
            loggerService.logApiError('firestoreService.getAllFiles', error);
            throw error;
        }
    },

    /**
     * Delete a friend
     */
    deleteFriend: async (userId: string, friendId: string) => {
        try {
            loggerService.logRequest('firestoreService.deleteFriend', { userId, friendId });
            const friendRef = firestore().collection("users").doc(userId).collection("friends").doc(friendId);
            await friendRef.delete();
            loggerService.logResponse('firestoreService.deleteFriend', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.deleteFriend', error);
            throw error;
        }
    },

    /**
     * Add a Secure QR
     */
    addSecureQR: async (userId: string, qrData: { label: string, documentIds: string[], filesCount: number }) => {
        try {
            loggerService.logRequest('firestoreService.addSecureQR', { userId, qrData });

            const batch = firestore().batch();

            const qrsRef = firestore().collection("users").doc(userId).collection("qrs");
            const newQrRef = qrsRef.doc();

            const newItem = {
                ...qrData,
                createdAt: new Date().toISOString(),
                date: new Date().toLocaleDateString('en-GB')
            };

            batch.set(newQrRef, newItem);

            const userRef = firestore().collection("users").doc(userId);
            batch.update(userRef, {
                qrsCount: firestore.FieldValue.increment(1)
            });

            await batch.commit();

            await addNotificationHelper(userId, {
                title: 'New QR Created',
                message: `Secure QR "${qrData.label}" has been created with ${qrData.filesCount} files.`,
                type: 'qr'
            });

            loggerService.logResponse('firestoreService.addSecureQR', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.addSecureQR', error);
            throw error;
        }
    },

    /**
     * Send a request (Document or Card)
     */
    sendRequest: async (requesterId: string, targetId: string, targetName: string, type: 'document' | 'card', item: string) => {
        try {
            loggerService.logRequest('firestoreService.sendRequest', { requesterId, targetId, targetName, type, item });

            const userRef = firestore().collection("users").doc(requesterId);
            await userRef.update({
                activeRequestsCount: firestore.FieldValue.increment(1)
            });

            await addNotificationHelper(requesterId, {
                title: 'Request Sent',
                message: `You requested a ${type} (${item}) from ${targetName}.`,
                type: 'system'
            });

            loggerService.logResponse('firestoreService.sendRequest', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.sendRequest', error);
            throw error;
        }
    },

    /**
     * Get Secure QRs
     */
    getSecureQRs: async (userId: string) => {
        try {
            loggerService.logRequest('firestoreService.getSecureQRs', { userId });
            const qrsRef = firestore().collection("users").doc(userId).collection("qrs");
            const snapshot = await qrsRef.get();

            const qrs = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));

            loggerService.logResponse('firestoreService.getSecureQRs', { count: qrs.length });
            return qrs;
        } catch (error) {
            loggerService.logApiError('firestoreService.getSecureQRs', error);
            throw error;
        }
    },

    /**
     * Subscribe to Secure QRs
     */
    subscribeToSecureQRs: (userId: string, onUpdate: (qrs: any[]) => void) => {
        loggerService.logRequest('firestoreService.subscribeToSecureQRs', { userId });
        const qrsRef = firestore().collection("users").doc(userId).collection("qrs");
        const unsubscribe = qrsRef.onSnapshot((snapshot: any) => {
            const qrs = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            loggerService.logResponse('firestoreService.subscribeToSecureQRs', { count: qrs.length });
            onUpdate(qrs);
        }, (error: any) => {
            loggerService.logApiError('firestoreService.subscribeToSecureQRs', error);
        });
        return unsubscribe;
    },

    /**
     * Delete Secure QR
     */
    deleteSecureQR: async (userId: string, qrId: string, qrLabel: string) => {
        try {
            loggerService.logRequest('firestoreService.deleteSecureQR', { userId, qrId });
            const qrRef = firestore().collection("users").doc(userId).collection("qrs").doc(qrId);

            const batch = firestore().batch();
            batch.delete(qrRef);

            const userRef = firestore().collection("users").doc(userId);
            batch.update(userRef, {
                qrsCount: firestore.FieldValue.increment(-1)
            });

            await batch.commit();

            await addNotificationHelper(userId, {
                title: 'QR Deleted',
                message: `Secure QR "${qrLabel}" has been deleted.`,
                type: 'alert'
            });

            loggerService.logResponse('firestoreService.deleteSecureQR', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.deleteSecureQR', error);
            throw error;
        }
    },

    /**
     * Update Secure QR
     */
    updateSecureQR: async (userId: string, qrId: string, updates: any, label: string) => {
        try {
            loggerService.logRequest('firestoreService.updateSecureQR', { userId, qrId });
            const qrRef = firestore().collection("users").doc(userId).collection("qrs").doc(qrId);

            await qrRef.update({
                ...updates,
                updatedAt: new Date().toISOString()
            });

            await addNotificationHelper(userId, {
                title: 'QR Updated',
                message: `Secure QR "${label}" has been updated.`,
                type: 'system'
            });

            loggerService.logResponse('firestoreService.updateSecureQR', { success: true });
        } catch (error) {
            loggerService.logApiError('firestoreService.updateSecureQR', error);
            throw error;
        }
    },

    /**
     * Subscribe to Friends (Real-time)
     */
    subscribeToFriends: (userId: string, onUpdate: (friends: any[]) => void) => {
        loggerService.logRequest('firestoreService.subscribeToFriends', { userId });
        const friendsRef = firestore().collection("users").doc(userId).collection("friends");
        const q = friendsRef.orderBy('addedAt', 'desc');

        const unsubscribe = q.onSnapshot((snapshot: any) => {
            const friends = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            loggerService.logResponse('firestoreService.subscribeToFriends', { count: friends.length });
            onUpdate(friends);
        }, (error: any) => {
            loggerService.logApiError('firestoreService.subscribeToFriends', error);
        });
        return unsubscribe;
    },

    /**
     * Add Notification
     */
    addNotification: addNotificationHelper
};
