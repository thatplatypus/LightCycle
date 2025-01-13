import { get, writable } from 'svelte/store';
import { settings } from './settings';

interface GameState {
    isPlaying: boolean;
    isPaused: boolean;
    gameOver: boolean;
    score: number;
    isResetting: boolean;
    opponent: 'human' | 'computer' | null;
    winner: 'player1' | 'player2' | 'draw' | null;
}

const initialState: GameState = {
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    score: 0,
    isResetting: false,
    opponent: null,
    winner: null
};

export const gameState = writable<GameState>(initialState); 

export function restartGame() {
    const currentSettings = get(settings);
    const currentGameMode = currentSettings.gameMode;
    
    // First trigger cleanup
    gameState.set({
        isPlaying: false,
        isPaused: false,
        gameOver: false,
        score: 0,
        isResetting: true,
        winner: null,
        opponent: currentGameMode === 'local-multiplayer' ? 'human' : null
    });

    // Re-apply settings
    settings.set(currentSettings);

    // Brief delay to allow cleanup
    setTimeout(() => {
        // Start new game
        gameState.set({
            isPlaying: true,
            isPaused: false,
            gameOver: false,
            score: 0,
            isResetting: false,
            winner: null,
            opponent: currentGameMode === 'local-multiplayer' ? 'human' : null
        });
    }, 200);
} 