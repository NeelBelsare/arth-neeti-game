import './LoadingSkeleton.css';

/**
 * Pulsing placeholder blocks used while data is loading.
 * Accepts `lines` (number of skeleton rows) and `variant` ('card' | 'text' | 'stats').
 */
export default function LoadingSkeleton({ lines = 3, variant = 'text' }) {
    const widths = variant === 'stats'
        ? ['60%', '80%', '45%', '70%']
        : variant === 'card'
            ? ['100%', '90%', '75%']
            : ['95%', '80%', '60%', '90%', '70%'];

    return (
        <div className={`skeleton-container skeleton-${variant}`} aria-busy="true" aria-label="Loading…">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton-line"
                    style={{
                        width: widths[i % widths.length],
                        animationDelay: `${i * 0.08}s`,
                    }}
                />
            ))}
        </div>
    );
}
