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

export function cleanupGame() {
    gameState.set({
        isPlaying: false,
        isPaused: false,
        gameOver: false,
        score: 0,
        isResetting: false,
        opponent: null,
        winner: null
    });
}

export function restartGame() {
    const currentSettings = get(settings);
    const currentGameMode = currentSettings.gameMode;
    
    // First ensure cleanup
    cleanupGame();
    
    // Set resetting state
    gameState.set({
        ...get(gameState),
        isResetting: true
    });

    // Use Promise to ensure proper sequencing
    return new Promise<void>(resolve => {
        setTimeout(() => {
            gameState.set({
                isPlaying: true,
                isPaused: false,
                gameOver: false,
                score: 0,
                isResetting: false,
                winner: null,
                opponent: currentGameMode === 'local-multiplayer' ? 'human' : null
            });
            resolve();
        }, 100);
    });
} 