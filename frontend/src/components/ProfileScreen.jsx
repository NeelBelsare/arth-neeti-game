import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function ProfileScreen({ onBack }) {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.getProfile();
                setProfileData(data);
            } catch (err) {
                setError('Failed to load profile.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-emerald-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-300">
                <p className="mb-4">{error}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                    Back
                </button>
            </div>
        );
    }

    const { profile, game_history } = profileData;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 overflow-y-auto relative">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-4s' }}></div>
            </div>

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 sticky top-0 z-20">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent glow-text">
                        Player Profile
                    </h1>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:text-white flex items-center gap-2"
                    >
                        <span>←</span> Back to Menu
                    </button>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:bg-slate-800/60 transition-colors">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Games Played</h3>
                        <p className="text-5xl font-bold text-white tracking-tight">{profile.total_games}</p>
                    </div>
                    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:bg-slate-800/60 transition-colors">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Highest Wealth</h3>
                        <p className="text-4xl font-bold text-emerald-400 font-mono tracking-tight">₹{profile.highest_wealth?.toLocaleString()}</p>
                    </div>
                    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:bg-slate-800/60 transition-colors">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Best Score</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-5xl font-bold text-cyan-400">{profile.highest_score}</p>
                            <span className="text-sm text-slate-500">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div className="glass-panel rounded-2xl p-8 border border-slate-700/50">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <span className="text-2xl">🏆</span> Achievements
                    </h2>
                    {profile.badges && profile.badges.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                            {profile.badges.map((badge, index) => (
                                <div key={index} className="badge-shine relative px-4 py-2 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-200 border border-yellow-500/30 rounded-full text-sm font-medium shadow-lg shadow-yellow-900/10 group cursor-default hover:border-yellow-500/50 transition-colors">
                                    {badge}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-700/50 rounded-xl">
                            <p className="text-slate-500 italic">No badges earned yet.</p>
                            <p className="text-xs text-slate-600 mt-1">Complete games with high scores to earn them!</p>
                        </div>
                    )}
                </div>

                {/* Game History Table */}
                <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span>📜</span> Recent History
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                    <th className="p-5">Date</th>
                                    <th className="p-5">Persona</th>
                                    <th className="p-5">Wealth</th>
                                    <th className="p-5">Score</th>
                                    <th className="p-5">Outcome</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30 text-slate-300 transform transition-all">
                                {game_history.length > 0 ? (
                                    game_history.map((game) => (
                                        <tr key={game.id} className="hover:bg-slate-700/20 transition-colors group">
                                            <td className="p-5 text-sm text-slate-400 font-mono">
                                                {new Date(game.ended_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-5 font-medium text-white group-hover:text-emerald-300 transition-colors">
                                                {game.persona || 'Unknown'}
                                            </td>
                                            <td className="p-5 text-emerald-400 font-mono font-bold">
                                                ₹{game.final_wealth?.toLocaleString()}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-bold w-8 ${game.financial_literacy_score >= 80 ? 'text-emerald-400' : game.financial_literacy_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {game.financial_literacy_score}
                                                    </span>
                                                    <div className="w-24 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${game.financial_literacy_score >= 80 ? 'bg-emerald-400' : game.financial_literacy_score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                            style={{ width: `${Math.min(100, game.financial_literacy_score)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${game.end_reason === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    game.end_reason === 'BANKRUPTCY' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    }`}>
                                                    {game.end_reason?.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-slate-500">
                                            No games played yet. Start your journey!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
