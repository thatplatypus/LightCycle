<script lang="ts">
    import GameCanvas from '$lib/components/GameCanvas.svelte';
    import GameHeader from '$lib/components/GameHeader.svelte';
    import GameSplash from '$lib/components/GameSplash.svelte';
    import GameOver from '$lib/components/GameOver.svelte';
    import Game from '$lib/components/Game.svelte';
    import { gameState } from '$lib/stores/game-state';

    export const ssr = false;
</script>

{#if !$gameState.isPlaying && !$gameState.gameOver}
    <GameSplash />
{:else}
    <Game>
        <div class="relative">
            <GameCanvas />
            <GameHeader />
            {#if $gameState.gameOver}
                <GameOver />
            {/if}
        </div>
    </Game>
{/if}