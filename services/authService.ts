import {
    auth
} from "../firebaseConfig";
import {
    signInWithPhoneNumber,
    ApplicationVerifier,
    PhoneAuthProvider,
    signInWithCredential,
    signOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { loggerService } from "./loggerService";

export const authService = {
    /**
     * Send OTP to the provided phone number
     */
    sendOtp: async (phoneNumber: string, recaptchaVerifier?: ApplicationVerifier) => {
        try {
            loggerService.logRequest('authService.sendOtp', { phoneNumber });
            // If explicit verifier not provided, use a dummy one (works ONLY if appVerificationDisabledForTesting is true)
            // We must mock internal methods like _reset that the SDK calls
            const verifier = recaptchaVerifier || {
                type: 'recaptcha',
                verify: () => Promise.resolve('dummy-token'),
                clear: () => { },
                _reset: () => { } // Mocking internal/private method found in error logs
            } as any;

            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
            loggerService.logResponse('authService.sendOtp', { verificationId: confirmationResult.verificationId });
            return confirmationResult.verificationId;
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
            const credential = PhoneAuthProvider.credential(verificationId, code);
            const result = await signInWithCredential(auth, credential);
            loggerService.logResponse('authService.verifyOtp', { uid: result.user.uid });
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
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
            throw error;
        }
    },

    /**
     * Listen for authentication state changes
     */
    subscribeToAuthChanges: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },

    /**
     * Get the current user
     */
    getCurrentUser: () => {
        return auth.currentUser;
    }
};
