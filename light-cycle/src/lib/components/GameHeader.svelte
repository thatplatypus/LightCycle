<script lang="ts">
    import { gameState, restartGame } from '$lib/stores/game-state';
    import TronButton from '$lib/components/ui/tron-button.svelte';
    import { Settings, Pause, Play, Home, RefreshCw } from 'lucide-svelte';
    import SettingsDialog from './SettingsDialog.svelte';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { settings } from '$lib/stores/settings';
    let showSettings = false;

    function handleReset() {
        restartGame();
    }

    function handleSettingsClick() {
        showSettings = true;
    }

    function togglePause() {
        gameState.update(state => ({
            ...state,
            isPaused: !state.isPaused
        }));
    }

    // Handle Escape key
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            togglePause();
        }
    }

    function returnToMenu() {
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

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    });
</script>

<header class="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
    <div class="flex items-center gap-4">
        <TronButton title="Main Menu" on:click={returnToMenu}>
            <Home class="w-4 h-4" />
        </TronButton>
        <div class="text-2xl font-bold text-primary">
            Light Cycle
        </div>
    </div>
    
    <div class="flex items-center gap-8">
        {#if $gameState.isPaused}
            <div class="text-xl font-mono text-primary animate-pulse">
                PAUSED
            </div>
        {/if}
        {#if get(settings).gameMode === 'single'}
            <div class="text-3xl font-mono text-primary">
                {$gameState.score}
            </div>
        {/if}
    </div>
    
    <div class="flex gap-2">
        <TronButton title="Pause/Resume" on:click={togglePause}>
            {#if $gameState.isPaused}
                <Play class="w-4 h-4" />
            {:else}
                <Pause class="w-4 h-4" />
            {/if}
        </TronButton>
        
        <TronButton title="Refresh" on:click={handleReset}>
            <RefreshCw class="w-4 h-4" />
        </TronButton>
        
        <TronButton title="Settings" on:click={handleSettingsClick}>
            <Settings class="w-4 h-4" />
        </TronButton>
    </div>
</header>

<SettingsDialog 
    open={showSettings}
    onOpenChange={(open) => showSettings = open}
/> 