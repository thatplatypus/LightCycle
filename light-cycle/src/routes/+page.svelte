<script lang="ts">
    import GameCanvas from '$lib/components/GameCanvas.svelte';
    import GameHeader from '$lib/components/GameHeader.svelte';
    import GameSplash from '$lib/components/GameSplash.svelte';
    import GameOver from '$lib/components/GameOver.svelte';
    import { gameState } from '$lib/stores/game-state';
</script>

{#if !$gameState.isPlaying && !$gameState.gameOver}
    <GameSplash />
{:else}
    <div class="relative">
        <GameCanvas />
        <GameHeader />
        {#if $gameState.gameOver}
            <GameOver />
        {/if}
    </div>
{/if}