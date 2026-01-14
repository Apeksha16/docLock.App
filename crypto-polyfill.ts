/**
 * Crypto Polyfill for React Native
 * This must be imported at the app entry point to provide crypto.getRandomValues
 * which is required by CryptoJS for encryption operations
 */
import * as Crypto from 'expo-crypto';

// Polyfill crypto.getRandomValues for CryptoJS in React Native
if (typeof global.crypto === 'undefined') {
    global.crypto = {} as any;
}

if (typeof global.crypto.getRandomValues === 'undefined') {
    global.crypto.getRandomValues = ((array: any) => {
        const bytes = Crypto.getRandomBytes(array.length);
        for (let i = 0; i < bytes.length; i++) {
            array[i] = bytes[i];
        }
        return array;
    }) as any;
}
