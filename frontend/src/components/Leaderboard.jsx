import React from 'react';

const Leaderboard = ({ leaderboard }) => {
    if (!leaderboard || leaderboard.length === 0) {
        return (
            <div className="leaderboard leaderboard-empty">
                <h3>🏆 Leaderboard</h3>
                <p>No players yet. Be the first to complete the game!</p>
            </div>
        );
    }

    const getMedal = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    return (
        <div className="leaderboard">
            <h3>🏆 Top Players</h3>
            <div className="leaderboard-table">
                <div className="leaderboard-header">
                    <span className="rank">Rank</span>
                    <span className="name">Player</span>
                    <span className="score">Score</span>
                    <span className="persona">Title</span>
                </div>
                {leaderboard.map((entry) => (
                    <div
                        key={entry.rank}
                        className={`leaderboard-row ${entry.rank <= 3 ? 'top-three' : ''}`}
                    >
                        <span className="rank">{getMedal(entry.rank)}</span>
                        <span className="name">{entry.player_name}</span>
                        <span className="score">{entry.score.toLocaleString()}</span>
                        <span className="persona">{entry.persona}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
