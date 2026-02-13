import { useCallback } from 'react';
import { api } from '../api';
import { useSession } from '../contexts/SessionContext';

/**
 * Encapsulates all GameEngine API calls that need a session.
 * Returns stable callbacks suitable for passing to child components.
 */
export function useGameActions() {
    const { session, updateSession } = useSession();

    const handleUseLifeline = useCallback(async (cardId) => {
        if (!session) return null;
        try {
            const result = await api.useLifeline(session.id, cardId);
            if (result.session) updateSession(result.session);
            return result;
        } catch (err) {
            if (import.meta.env.DEV) console.error('useLifeline failed:', err);
            return null;
        }
    }, [session, updateSession]);

    const handleTakeLoan = useCallback(async (loanType) => {
        if (!session) return null;
        try {
            const result = await api.takeLoan(session.id, loanType);
            if (result.session) updateSession(result.session);
            return result;
        } catch (err) {
            if (import.meta.env.DEV) console.error('takeLoan failed:', err);
            return null;
        }
    }, [session, updateSession]);

    const handleGetAIAdvice = useCallback(async (cardId) => {
        if (!session) return null;
        try {
            return await api.getAIAdvice(session.id, cardId);
        } catch (err) {
            if (import.meta.env.DEV) console.error('getAIAdvice failed:', err);
            return null;
        }
    }, [session]);

    const handleBuyStock = useCallback(async (sector, amount) => {
        if (!session) return null;
        try {
            const result = await api.buyStock(session.id, sector, amount);
            if (result.session) updateSession(result.session);
            return result;
        } catch (err) {
            if (import.meta.env.DEV) console.error('buyStock failed:', err);
            return { error: err.message };
        }
    }, [session, updateSession]);

    const handleSellStock = useCallback(async (sector, units) => {
        if (!session) return null;
        try {
            const result = await api.sellStock(session.id, sector, units);
            if (result.session) updateSession(result.session);
            return result;
        } catch (err) {
            if (import.meta.env.DEV) console.error('sellStock failed:', err);
            return { error: err.message };
        }
    }, [session, updateSession]);

    return {
        handleUseLifeline,
        handleTakeLoan,
        handleGetAIAdvice,
        handleBuyStock,
        handleSellStock,
    };
}
