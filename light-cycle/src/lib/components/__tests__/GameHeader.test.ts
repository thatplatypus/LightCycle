import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import GameHeader from '../GameHeader.svelte';
import { get } from 'svelte/store';
import { gameState } from '../../stores/game-state';

describe('GameHeader', () => {
    it('should toggle pause state when pause button clicked', async () => {
        const { getByRole } = render(GameHeader);
        const pauseButton = getByRole('button', { name: /pause/i });
        
        await fireEvent.click(pauseButton);
        expect(get(gameState).isPaused).toBe(true);
        
        await fireEvent.click(pauseButton);
        expect(get(gameState).isPaused).toBe(false);
    });
}); 