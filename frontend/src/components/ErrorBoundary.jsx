import { Component } from 'react';

/**
 * React Error Boundary — catches render errors in child component tree
 * and displays a friendly fallback UI instead of a blank screen.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        if (import.meta.env.DEV) {
            console.error('[ErrorBoundary]', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="container flex-col-center" style={{ minHeight: '60vh' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💥</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', maxWidth: '480px' }}>
                        An unexpected error occurred. You can try refreshing the page or returning home.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre style={{
                            background: 'rgba(255,0,0,0.1)',
                            padding: '1rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            maxWidth: '600px',
                            overflowX: 'auto',
                            marginBottom: '1.5rem',
                            color: '#ff6b6b',
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={this.handleReset}>
                            Try Again
                        </button>
                        <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
