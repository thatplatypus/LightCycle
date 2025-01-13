<script lang="ts">
    import { onMount } from 'svelte';
    import { GameEngine } from '$lib/game/engine';
    import { gameState } from '$lib/stores/game-state';
    import { fade } from 'svelte/transition';

    let canvas: HTMLCanvasElement;
    let gameEngine: GameEngine;
    let error: string | null = null;
    let key = 0; // Used to force re-render

    // Watch for reset
    $: if ($gameState.isResetting) {
        if (gameEngine) {
            gameEngine.stopGame();
            gameEngine = null;
        }
        key++;
    }

    onMount(async () => {
        try {
            gameEngine = new GameEngine(canvas);
            await gameEngine.startGame();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to initialize game';
            console.error('Game initialization failed:', e);
        }
        
        return () => {
            if (gameEngine) {
                gameEngine.stopGame();
            }
        };
    });
</script>

<main class="w-full h-screen bg-black relative">
    {#if error}
        <div class="text-red-500 p-4">
            {error}
        </div>
    {/if}
    {#key key}
        <canvas
            bind:this={canvas}
            class="w-full h-full"
            transition:fade={{ duration: 150 }}
        />
    {/key}
</main>