import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const SessionContext = createContext(null);

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within SessionProvider');
    }
    return context;
};

export const SessionProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const SESSION_STORAGE_KEY = 'arthneeti_session_id';

    useEffect(() => {
        const loadSession = async () => {
            const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
            if (savedSessionId) {
                try {
                    const sessionData = await api.getSession(savedSessionId);
                    if (sessionData.session && sessionData.session.is_active) {
                        setSession(sessionData.session);
                    } else {
                        localStorage.removeItem(SESSION_STORAGE_KEY);
                    }
                } catch (err) {
                    console.log('Could not load session:', err);
                    localStorage.removeItem(SESSION_STORAGE_KEY);
                }
            }
        };
        loadSession();
    }, []);

    const startGame = useCallback(async () => {
        try {
            const data = await api.startGame();
            setSession(data.session);
            localStorage.setItem(SESSION_STORAGE_KEY, data.session.id);
            return data.session;
        } catch (err) {
            console.error('Failed to start game:', err);
            throw err;
        }
    }, []);

    const updateSession = useCallback((newSession) => {
        setSession(newSession);
        if (newSession && newSession.id) {
            localStorage.setItem(SESSION_STORAGE_KEY, newSession.id);
        }
    }, []);

    const clearSession = useCallback(() => {
        setSession(null);
        localStorage.removeItem(SESSION_STORAGE_KEY);
    }, []);

    return (
        <SessionContext.Provider value={{ session, startGame, updateSession, clearSession }}>
            {children}
        </SessionContext.Provider>
    );
};
