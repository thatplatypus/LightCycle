import { describe, it, expect, beforeEach } from 'vitest';
import { Player, Direction } from '../player';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/game-state';
import { settings } from '$lib/stores/settings';

describe('Player', () => {
    let player: Player;

    beforeEach(() => {
        // Reset game state
        gameState.set({
            isPlaying: true,
            isPaused: false,
            gameOver: false,
            score: 0,
            isResetting: false,
            opponent: null,
            winner: null
        });

        // Initialize player
        player = new Player(100, 100, 10, Direction.RIGHT, '#ffffff', 1);
    });

    describe('movement', () => {
        it('should prevent 180-degree turns', () => {
            player.setDirection(Direction.LEFT);
            expect(player.getPosition().x).toBe(100); // Should not have moved
            
            player.setDirection(Direction.UP);
            player.update(16);
            expect(player.getPosition().y).toBeLessThan(100); // Should move up
        });

        it('should update position based on direction', () => {
            player.update(16);
            expect(player.getPosition().x).toBeGreaterThan(100); // Moving right
            
            player.setDirection(Direction.DOWN);
            player.update(16);
            expect(player.getPosition().y).toBeGreaterThan(100); // Moving down
        });
    });

    describe('collision detection', () => {
        it('should detect trail collisions', () => {
            // Create a longer trail by moving more
            for (let i = 0; i < 5; i++) {
                player.update(16);  // Move right
            }
            player.setDirection(Direction.DOWN);
            for (let i = 0; i < 5; i++) {
                player.update(16);  // Move down
            }
            player.setDirection(Direction.LEFT);
            for (let i = 0; i < 5; i++) {
                player.update(16);  // Move left
            }

            // Check collision with trail
            expect(player.checkCollisionWithPoint({ x: 100, y: 100 })).toBe(true);
            expect(player.checkCollisionWithPoint({ x: 200, y: 200 })).toBe(false);
        });
    });

    describe('scoring', () => {
        it('should update score in single player mode', () => {
            settings.update(s => ({ ...s, gameMode: 'single' }));
            
            // Move player enough to trigger score (more than 50 pixels)
            for (let i = 0; i < 10; i++) {
                player.update(16);
            }
            const score = get(gameState).score;
            expect(score).toBeGreaterThan(0);
        });

        it('should not update score in multiplayer mode', () => {
            settings.update(s => ({ ...s, gameMode: 'local-multiplayer' }));
            gameState.update(s => ({ ...s, opponent: 'human' }));
            
            // Move player
            player.update(16);
            expect(get(gameState).score).toBe(0);
        });
    });
}); 