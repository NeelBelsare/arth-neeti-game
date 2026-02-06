/**
 * Authentication Context
 * Provides Firebase authentication state throughout the app
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🔐 AuthProvider: Setting up auth state listener');
        
        // Subscribe to auth state changes
        const unsubscribe = onAuthChange(async (user) => {
            try {
                console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
                setCurrentUser(user);
                setError(null);
            } catch (err) {
                console.error('❌ Auth state change error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => {
            console.log('🔐 AuthProvider: Cleaning up auth listener');
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        loading,
        error,
    };

    // Show loading screen while checking auth state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
                color: 'white',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '4px solid #f472b6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ fontSize: '1.125rem', color: '#94a3b8' }}>Loading...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};