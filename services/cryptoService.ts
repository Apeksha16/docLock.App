import CryptoJS from 'crypto-js';
import { loggerService } from './loggerService';

export const cryptoService = {
    /**
     * Hash the MPIN using SHA-256 with a salt (userId)
     * @param mpin The actual MPIN entered by the user
     * @param userId The user ID used as a salt
     * @returns The hashed string
     */
    hashMpin: (mpin: string, userId: string): string => {
        try {
            // Combine MPIN with UserID (Salt) to prevent rainbow table attacks
            const salt = userId;
            const data = mpin + salt;

            // Generate SHA-256 Hash
            const hash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);

            return hash;
        } catch (error) {
            loggerService.logApiError('cryptoService.hashMpin', error);
            throw error;
        }
    },

    /**
     * Verify if the input MPIN matches the stored hash
     * @param inputMpin The MPIN entered by the user
     * @param storedHash The hash stored in the database
     * @param userId The user ID used as a salt
     */
    verifyMpin: (inputMpin: string, storedHash: string, userId: string): boolean => {
        const inputHash = cryptoService.hashMpin(inputMpin, userId);
        return inputHash === storedHash;
    }
};
