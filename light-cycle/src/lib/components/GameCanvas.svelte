<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { GameEngine } from '$lib/game/engine';
    import { gameState, cleanupGame } from '$lib/stores/game-state';

    let canvas: HTMLCanvasElement;
    let gameEngine: GameEngine | null = null;

    onMount(() => {
        if (canvas) {
            gameEngine = new GameEngine(canvas);
            gameEngine.startGame();
        }
    });

    onDestroy(() => {
        if (gameEngine) {
            gameEngine.stopGame();
            gameEngine = null;
        }
        cleanupGame();
    });

    // Watch for game state changes
    $: if ($gameState.isResetting && gameEngine) {
        gameEngine.stopGame();
        gameEngine = new GameEngine(canvas);
        gameEngine.startGame();
    }
</script>

<canvas
    bind:this={canvas}
    id="gameCanvas"
    class="fixed inset-0 w-full h-full"
></canvas>