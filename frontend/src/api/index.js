const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Import Firebase auth
import { auth } from '../firebase/config';

const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (user) {
        try {
            const token = await user.getIdToken();
            return { 'Authorization': `Bearer ${token}` };
        } catch (error) {
            console.error('Failed to get Firebase token:', error);
            return {};
        }
    }
    return {};
};

export const api = {
    // --- AUTHENTICATION ---
    // NOTE: register() and login() methods removed
    // Authentication is now handled by Firebase SDK (see services/authService.js)

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/profile/`, {
            headers: { ...(await getAuthHeaders()) },
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    // --- GAME SESSION ---
    async startGame() {
        // Pass Firebase auth token
        const response = await fetch(`${API_BASE_URL}/start-game/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await getAuthHeaders()),
            },
        });
        if (!response.ok) throw new Error('Failed to start game');
        return response.json();
    },

    async getCard(sessionId) {
        const response = await fetch(`${API_BASE_URL}/get-card/${sessionId}/`, {
            headers: { ...(await getAuthHeaders()) },
        });
        if (!response.ok) throw new Error('Failed to get card');
        return response.json();
    },

    async submitChoice(sessionId, cardId, choiceId) {
        const response = await fetch(`${API_BASE_URL}/submit-choice/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await getAuthHeaders()),
            },
            body: JSON.stringify({
                session_id: sessionId,
                card_id: cardId,
                choice_id: choiceId,
            }),
        });
        if (!response.ok) throw new Error('Failed to submit choice');
        return response.json();
    },

    async getSession(sessionId) {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/`, {
            headers: { ...(await getAuthHeaders()) },
        });
        if (!response.ok) throw new Error('Failed to get session');
        return response.json();
    },

    // --- UTILITIES ---
    async useLifeline(sessionId, cardId) {
        const response = await fetch(`${API_BASE_URL}/use-lifeline/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
            body: JSON.stringify({ session_id: sessionId, card_id: cardId }),
        });
        if (!response.ok) throw new Error('Failed to use lifeline');
        return response.json();
    },

    async takeLoan(sessionId, loanType) {
        const response = await fetch(`${API_BASE_URL}/take-loan/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
            body: JSON.stringify({ session_id: sessionId, loan_type: loanType }),
        });
        if (!response.ok) throw new Error('Failed to take loan');
        return response.json();
    },

    async skipCard(sessionId, cardId) {
        const response = await fetch(`${API_BASE_URL}/skip-card/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
            body: JSON.stringify({ session_id: sessionId, card_id: cardId }),
        });
        if (!response.ok) throw new Error('Failed to skip card');
        return response.json();
    },

    async getAIAdvice(sessionId, cardId) {
        const response = await fetch(`${API_BASE_URL}/ai-advice/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
            body: JSON.stringify({ session_id: sessionId, card_id: cardId }),
        });
        if (!response.ok) throw new Error('Failed to get AI advice');
        return response.json();
    },

    async getLeaderboard() {
        const response = await fetch(`${API_BASE_URL}/leaderboard/`);
        if (!response.ok) throw new Error('Failed to get leaderboard');
        return response.json();
    },

    // --- STOCK MARKET 2.0 ---
    async getMarketStatus(sessionId) {
        const response = await fetch(`${API_BASE_URL}/market-status/${sessionId}/`, {
            headers: { ...(await getAuthHeaders()) },
        });
        if (!response.ok) throw new Error('Failed to get market status');
        return response.json();
    },

    async buyStock(sessionId, sector, amount) {
        const response = await fetch(`${API_BASE_URL}/buy-stock/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
            body: JSON.stringify({ session_id: sessionId, sector, amount }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to buy stock');
        return data;
    },

    async sellStock(sessionId, sector, units) {
        const response = await fetch(`${API_BASE_URL}/sell-stock/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
            body: JSON.stringify({ session_id: sessionId, sector, units }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to sell stock');
        return data;
    },
};
