import { get, writable } from 'svelte/store';
import { settings } from './settings';

export interface PlayerInfo {
    position: { x: number; y: number };
    direction: number; // Direction enum value
    trail: Array<{ x: number; y: number }>;
    isAlive: boolean;
}

export interface GameBounds {
    width: number;
    height: number;
}

export interface GameState {
    isPlaying: boolean;
    isPaused: boolean;
    gameOver: boolean;
    score: number;
    isResetting: boolean;
    opponent: 'human' | 'computer' | null;
    winner: 'player1' | 'player2' | 'draw' | null;
    // Enhanced fields for AI
    bounds: GameBounds;
    player1: PlayerInfo;
    player2: PlayerInfo;
    lastUpdate: number;
}

const initialState: GameState = {
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    score: 0,
    isResetting: false,
    opponent: null,
    winner: null,
    bounds: { width: 0, height: 0 },
    player1: {
        position: { x: 0, y: 0 },
        direction: 1, // Direction.RIGHT
        trail: [],
        isAlive: true
    },
    player2: {
        position: { x: 0, y: 0 },
        direction: 3, // Direction.LEFT
        trail: [],
        isAlive: true
    },
    lastUpdate: 0
};

export const gameState = writable<GameState>(initialState);

// Helper functions for updating game state
export function updateGameBounds(width: number, height: number) {
    gameState.update(state => ({
        ...state,
        bounds: { width, height },
        lastUpdate: Date.now()
    }));
}

export function updatePlayer1Info(position: { x: number; y: number }, direction: number, trail: Array<{ x: number; y: number }>, isAlive: boolean = true) {
    gameState.update(state => ({
        ...state,
        player1: {
            position,
            direction,
            trail,
            isAlive
        },
        lastUpdate: Date.now()
    }));
}

export function updatePlayer2Info(position: { x: number; y: number }, direction: number, trail: Array<{ x: number; y: number }>, isAlive: boolean = true) {
    gameState.update(state => ({
        ...state,
        player2: {
            position,
            direction,
            trail,
            isAlive
        },
        lastUpdate: Date.now()
    }));
}

export function setPlayer1Alive(isAlive: boolean) {
    gameState.update(state => ({
        ...state,
        player1: {
            ...state.player1,
            isAlive
        },
        lastUpdate: Date.now()
    }));
}

export function setPlayer2Alive(isAlive: boolean) {
    gameState.update(state => ({
        ...state,
        player2: {
            ...state.player2,
            isAlive
        },
        lastUpdate: Date.now()
    }));
}

export function cleanupGame() {
    gameState.set({
        isPlaying: false,
        isPaused: false,
        gameOver: false,
        score: 0,
        isResetting: false,
        opponent: null,
        winner: null,
        bounds: { width: 0, height: 0 },
        player1: {
            position: { x: 0, y: 0 },
            direction: 1,
            trail: [],
            isAlive: true
        },
        player2: {
            position: { x: 0, y: 0 },
            direction: 3,
            trail: [],
            isAlive: true
        },
        lastUpdate: 0
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
                opponent: currentGameMode === 'local-multiplayer' ? 'human' : 
                         currentGameMode === 'ai' ? 'computer' : null,
                bounds: { width: window.innerWidth, height: window.innerHeight },
                player1: {
                    position: { x: 100, y: window.innerHeight / 2 },
                    direction: 1, // Direction.RIGHT
                    trail: [],
                    isAlive: true
                },
                player2: {
                    position: { x: window.innerWidth - 200, y: window.innerHeight / 2 },
                    direction: 3, // Direction.LEFT
                    trail: [],
                    isAlive: true
                },
                lastUpdate: Date.now()
            });
            resolve();
        }, 100);
    });
} 