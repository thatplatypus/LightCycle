import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { gameState, restartGame } from '../game-state';
import { settings } from '../settings';

describe('Game State Store', () => {
    beforeEach(() => {
        // Reset to initial state
        gameState.set({
            isPlaying: false,
            isPaused: false,
            gameOver: false,
            score: 0,
            isResetting: false,
            opponent: null,
            winner: null
        });
    });

    describe('restartGame', () => {
        it('should properly reset game state', () => {
            // Setup initial state
            settings.update(s => ({ ...s, gameMode: 'single' }));
            gameState.update(s => ({ ...s, score: 100, isPlaying: true }));
            
            // Call restart
            restartGame();
            
            // Check immediate state
            let state = get(gameState);
            expect(state.isResetting).toBe(true);
            expect(state.score).toBe(0);
            
            // Check final state after timeout
            return new Promise(resolve => {
                setTimeout(() => {
                    state = get(gameState);
                    expect(state.isPlaying).toBe(true);
                    expect(state.isResetting).toBe(false);
                    expect(state.score).toBe(0);
                    resolve(true);
                }, 250);
            });
        });

        it('should maintain correct game mode after restart', () => {
            settings.update(s => ({ ...s, gameMode: 'local-multiplayer' }));
            restartGame();
            
            const state = get(gameState);
            expect(state.opponent).toBe('human');
        });
    });
}); 