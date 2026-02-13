/**
 * Firebase Configuration
 * Initialize Firebase SDK with environment variables
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateConfig = () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
    
    if (missingFields.length > 0) {
        if (import.meta.env.DEV) console.error('❌ Missing Firebase configuration:', missingFields);
        if (import.meta.env.DEV) console.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set');
        return false;
    }
    
    if (import.meta.env.DEV) console.log('✅ Firebase configuration validated');
    return true;
};

// Validate before initializing
if (!validateConfig()) {
    throw new Error('Firebase configuration is incomplete. Check console for details.');
}

// Initialize Firebase
if (import.meta.env.DEV) console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
if (import.meta.env.DEV) console.log('✅ Firebase initialized successfully');

// Initialize Firebase Authentication
export const auth = getAuth(app);
if (import.meta.env.DEV) console.log('✅ Firebase Auth initialized');

export default app;