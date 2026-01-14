import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { loggerService } from "./loggerService";

export const authService = {
    /**
     * Send OTP to the provided phone number
     * React Native Firebase uses native phone auth - no reCAPTCHA verifier needed
     */
    sendOtp: async (phoneNumber: string) => {
        try {
            loggerService.logRequest('authService.sendOtp', { phoneNumber });
            const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
            loggerService.logResponse('authService.sendOtp', { verificationId: confirmation.verificationId });
            return confirmation.verificationId;
        } catch (error) {
            loggerService.logApiError('authService.sendOtp', error);
            throw error;
        }
    },

    /**
     * Verify the OTP code
     */
    verifyOtp: async (verificationId: string, code: string) => {
        try {
            loggerService.logRequest('authService.verifyOtp', { verificationId, code });
            const credential = auth.PhoneAuthProvider.credential(verificationId, code);
            await auth().signInWithCredential(credential);
            loggerService.logResponse('authService.verifyOtp', { success: true });
            return true;
        } catch (error) {
            loggerService.logApiError('authService.verifyOtp', error);
            throw error;
        }
    },

    /**
     * Sign out the current user
     */
    logout: async () => {
        try {
            await auth().signOut();
        } catch (error) {
            loggerService.logApiError('authService.logout', error);
            throw error;
        }
    },

    /**
     * Listen for authentication state changes
     */
    subscribeToAuthChanges: (callback: (user: FirebaseAuthTypes.User | null) => void) => {
        return auth().onAuthStateChanged(callback);
    },

    /**
     * Get the current user
     */
    getCurrentUser: () => {
        return auth().currentUser;
    }
};
