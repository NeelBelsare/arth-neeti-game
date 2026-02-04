import React, { useState } from 'react';
import { api } from '../api';

export default function RegisterScreen({ onLoginSuccess, onNavigateToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const data = await api.register(username, password, email);
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('username', data.username);
            onLoginSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="premium-wrapper">
            {/* Background Blob */}
            <div className="bg-blob blob-pink animate-float" style={{ top: '-10%', right: '-10%' }}></div>

            <div className="premium-card">

                {/* LEFT SIDE - FORM */}
                <div className="split-side split-left">
                    <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                        {/* Logo / Brand */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div className="brand-icon animate-float" style={{ background: 'linear-gradient(135deg, #ec4899, #fb923c)' }}>
                                💎
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Create Account</h1>
                            <p style={{ color: '#94a3b8' }}>Join the elite financial circle.</p>
                        </div>

                        {error && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '1rem', color: '#fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="pill-input-group">
                                <label className="pill-label">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pill-input"
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>

                            <div className="pill-input-group">
                                <label className="pill-label">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pill-input"
                                    placeholder="name@example.com"
                                />
                            </div>

                            <div className="pill-input-group">
                                <label className="pill-label">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pill-input"
                                    placeholder="Strong password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="gradient-btn"
                                style={{ background: 'linear-gradient(to right, #ec4899, #fb923c)' }}
                            >
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                onClick={onNavigateToLogin}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}
                            >
                                Already have an account? <span style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '4px', color: '#f472b6' }}>Log In</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - CONTENT CARD */}
                <div className="split-side split-right">
                    {/* Decorative Gradient */}
                    <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '120%', height: '120%', background: 'radial-gradient(circle at center, rgba(88, 28, 135, 0.3) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

                    {/* Top Content */}
                    <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }} className="animate-spin-slow">
                            🌟
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ position: 'relative', zIndex: 10, paddingRight: '2.5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', lineHeight: 1.2 }}>
                            Master The<br />
                            <span className="gradient-text-hero" style={{ background: 'linear-gradient(to right, #ec4899, #fb923c)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>Art of Neeti.</span>
                        </h2>

                        <div className="quote-symbol" style={{ color: '#fb923c' }}>“</div>
                        <p className="quote-text">
                            "Do not save what is left after spending, but spend what is left after saving."
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.125rem' }}>Warren Buffett</div>
                                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Advice on Saving</div>
                            </div>

                            {/* Decorative Starburst */}
                            <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', inset: 0, border: '1px solid #334155', borderRadius: '50%', animationDelay: '-1s' }} className="animate-pulse"></div>
                                <div style={{ fontSize: '2.5rem', color: '#fb923c' }}>
                                    🪙
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Nav Mockup */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(251, 146, 60, 0.2)', border: '1px solid rgba(251, 146, 60, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb923c', cursor: 'pointer' }}>
                            ←
                        </button>
                        <button style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', cursor: 'pointer' }}>
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
