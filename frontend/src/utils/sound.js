// Sound effect utilities for Arth-Neeti game
// Uses Web Audio API for synthesized sounds

let audioContext = null;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
};

export const playSound = (type) => {
    try {
        const ctx = getAudioContext();
        const currentTime = ctx.currentTime;

        switch (type) {
            case 'success': {
                // "Ching!" sound - high pitch coin sound
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1200, currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(2000, currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.3, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);

                oscillator.start();
                oscillator.stop(currentTime + 0.3);
                break;
            }

            case 'error': {
                // "Buzz" sound - low pitch warning
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, currentTime);
                oscillator.frequency.linearRampToValueAtTime(100, currentTime + 0.3);

                gainNode.gain.setValueAtTime(0.3, currentTime);
                gainNode.gain.linearRampToValueAtTime(0.01, currentTime + 0.3);

                oscillator.start();
                oscillator.stop(currentTime + 0.3);
                break;
            }

            case 'click': {
                // Subtle click feedback
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, currentTime + 0.05);

                gainNode.gain.setValueAtTime(0.15, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.08);

                oscillator.start();
                oscillator.stop(currentTime + 0.08);
                break;
            }

            case 'cardFlip': {
                // Whoosh effect for new card
                const noise = ctx.createBufferSource();
                const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * (1 - i / buffer.length);
                }
                
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1000, currentTime);
                filter.frequency.exponentialRampToValueAtTime(400, currentTime + 0.2);
                filter.Q.value = 1;
                
                const gainNode = ctx.createGain();
                gainNode.gain.setValueAtTime(0.2, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
                
                noise.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                noise.start();
                break;
            }

            case 'levelUp': {
                // Ascending tones for positive events
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                
                notes.forEach((freq, index) => {
                    const oscillator = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = freq;
                    
                    const startTime = currentTime + index * 0.08;
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + 0.15);
                });
                break;
            }

            case 'gameOver': {
                // Dramatic finish sound
                const notes = [392, 349.23, 329.63, 293.66]; // G4, F4, E4, D4 - descending
                
                notes.forEach((freq, index) => {
                    const oscillator = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.value = freq;
                    
                    const startTime = currentTime + index * 0.2;
                    gainNode.gain.setValueAtTime(0.25, startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + 0.3);
                });
                break;
            }

            case 'celebration': {
                // Cheerful jingle for good choices
                const notes = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.50];
                
                notes.forEach((freq, index) => {
                    const oscillator = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = freq;
                    
                    const startTime = currentTime + index * 0.06;
                    gainNode.gain.setValueAtTime(0.15, startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + 0.1);
                });
                break;
            }

            default:
                console.warn('Unknown sound type:', type);
        }
    } catch (err) {
        console.warn('Audio playback failed:', err);
    }
};
