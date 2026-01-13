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
            if (!text) {
                console.log("encryptData: Empty input, returning empty string");
                return '';
            }
            console.log(`encryptData: Attempting to encrypt ${text.length} chars`);
            const ciphertext = CryptoJS.AES.encrypt(text, APP_SECRET).toString();
            console.log(`encryptData: Success! Result is ${ciphertext.length} chars`);
            return ciphertext;
        } catch (error) {
            console.error("encryptData: ENCRYPTION FAILED!", error);
            console.error("encryptData: Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
            // If originalText is empty, it means decryption failed (likely not encrypted or wrong key).
            // Fallback to returning ciphertext (assuming it's plaintext legacy data).
            return originalText || ciphertext;
        } catch (error) {
            loggerService.logApiError('encryptionService.decryptData', error);
            // Fallback: return the original text assuming it was not encrypted
            return ciphertext;
        }
    }
};
