import CryptoJS from 'crypto-js';
import { loggerService } from './loggerService';

const APP_SECRET = 'DOCLOCK_SECURE_VAULT_KEY_2026';

export const encryptionService = {

    /**
     * Encrypts a string using AES
     * @param text The plaintext to encrypt
     * @returns The ciphertext string
     */
    encryptData: (text: string): string => {
        try {
            if (!text) {
                return '';
            }
            const ciphertext = CryptoJS.AES.encrypt(text, APP_SECRET).toString();
            return ciphertext;
        } catch (error) {
            loggerService.logApiError('encryptionService.encryptData', error);
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
            return originalText || ciphertext;
        } catch (error) {
            loggerService.logApiError('encryptionService.decryptData', error);
            return ciphertext;
        }
    }
};
