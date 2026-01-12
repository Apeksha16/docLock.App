import CryptoJS from 'crypto-js';
import { loggerService } from './loggerService';

// In a production app, the key should be retrieved from a secure key management system 
// or derived from user credentials + salt.
// For this MVP, we use a fixed app secret combined with a runtime constant.
const APP_SECRET = 'DOCLOCK_SECURE_VAULT_KEY_2026';

export const encryptionService = {

    /**
     * Encrypts a string using AES
     * @param text The plaintext to encrypt
     * @returns The ciphertext string
     */
    encryptData: (text: string): string => {
        try {
            if (!text) return '';
            const ciphertext = CryptoJS.AES.encrypt(text, APP_SECRET).toString();
            return ciphertext;
        } catch (error) {
            loggerService.logApiError('encryptionService.encryptData', error);
            // Fallback: return empty string or throw depending on security requirements
            // Returning empty string prevents storing corrupt/unencrypted data
            return '';
        }
    },

    /**
     * Decrypts a ciphertext string using AES
     * @param ciphertext The encrypted string
     * @returns The decrypted plaintext
     */
    decryptData: (ciphertext: string): string => {
        try {
            if (!ciphertext) return '';
            const bytes = CryptoJS.AES.decrypt(ciphertext, APP_SECRET);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            return originalText;
        } catch (error) {
            loggerService.logApiError('encryptionService.decryptData', error);
            return '';
        }
    }
};
