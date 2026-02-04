import React, { useState } from 'react';
import { api } from '../api';
import { initAudio } from '../utils/sound';

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        initAudio(); // Initialize audio context on user gesture
        setError(null);
        setIsLoading(true);

        try {
            const data = await api.login(username, password);
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
            <div className="bg-blob blob-purple animate-float" style={{ top: '-10%', left: '-10%' }}></div>

            <div className="premium-card">

                {/* LEFT SIDE - FORM */}
                <div className="split-side split-left">
                    <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                        {/* Logo / Brand */}
                        <div style={{ marginBottom: '3rem' }}>
                            <div className="brand-icon animate-float">
                                🚀
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome back</h1>
                            <p style={{ color: '#94a3b8' }}>Please Enter your Account details</p>
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
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>

                            <div className="pill-input-group">
                                <label className="pill-label">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pill-input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.875rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', cursor: 'pointer' }}>
                                    <input type="checkbox" style={{ borderRadius: '4px', background: '#0f3460', border: 'none' }} />
                                    Keep me logged in
                                </label>
                                <button type="button" style={{ background: 'none', border: 'none', color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer' }}>
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="gradient-btn"
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                onClick={onNavigateToRegister}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}
                            >
                                New here? <span style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '4px', color: '#f472b6' }}>Create an Account</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - CONTENT CARD */}
                <div className="split-side split-right">
                    {/* Decorative Gradient */}
                    <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '120%', height: '120%', background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.3) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

                    {/* Top Content */}
                    <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }} className="animate-spin-slow">
                            ❄️
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ position: 'relative', zIndex: 10, paddingRight: '2.5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', lineHeight: 1.2 }}>
                            Build Your<br />
                            <span className="gradient-text-hero">Financial Empire.</span>
                        </h2>

                        <div className="quote-symbol">“</div>
                        <p className="quote-text">
                            "The stock market is a device for transferring money from the impatient to the patient."
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.125rem' }}>Warren Buffett</div>
                                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Legendary Investor</div>
                            </div>

                            {/* Decorative Starburst */}
                            <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', inset: 0, border: '1px solid #334155', borderRadius: '50%' }} className="animate-pulse"></div>
                                <div style={{ fontSize: '2.5rem', color: '#ec4899' }}>
                                    ✳️
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Nav Mockup */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', border: '1px solid rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6', cursor: 'pointer' }}>
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
