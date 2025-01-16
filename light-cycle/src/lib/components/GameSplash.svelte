<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { settings } from '$lib/stores/settings';
    import { gameState } from '$lib/stores/game-state';
    import { get } from 'svelte/store';
    import SettingsDialog from './SettingsDialog.svelte';
    import TronButton from './ui/tron-button.svelte';
    import { Settings } from 'lucide-svelte';
    import TronGrid from './TronGrid.svelte';
    import { onMount } from 'svelte';
    import { audioManager } from '$lib/audio/manager';
    import { audioState } from '$lib/stores/audio-state';
    import { isTouchDevice } from '$lib/utils/device';

    let showSettings = false;
    let audioInitialized = false;

    const isTouch = isTouchDevice();

    onMount(async () => {
        try {
            console.log('[GameSplash] Initializing audio...');
            await audioManager.init();
            audioInitialized = true;
            
            console.log('[GameSplash] Starting background music...');
            audioManager.playMusic('background');
            audioState.update(s => ({ ...s, backgroundMusicStarted: true }));
        } catch (error) {
            console.error('[GameSplash] Failed to initialize audio:', error);
        }
    });

    async function startGame(mode: 'single' | 'local-multiplayer' | 'ai') {
        settings.update(s => ({
            ...s,
            gameMode: mode === 'ai' ? 'single' : mode
        }));

        gameState.set({
            isPlaying: true,
            isPaused: false,
            gameOver: false,
            score: 0,
            isResetting: false,
            winner: null,
            opponent: mode === 'local-multiplayer' ? 'human' : null
        });
    }
</script>

<div class="fixed inset-0 flex items-center justify-center z-0">
    <TronGrid />
    
    <div class="absolute top-4 right-4 z-10">
        <TronButton 
            title="Settings"
            on:click={() => showSettings = true}
        >
            <Settings class="w-4 h-4" />
        </TronButton>
    </div>
    
    <div class="relative text-primary space-y-8 max-w-lg p-8 z-10">
        <h1 class="text-4xl font-mono text-center mb-12 glow-text">LIGHT CYCLE</h1>
        
        <div class="grid gap-4">
            <TronButton 
                variant="large"
                on:click={() => startGame('single')}
            >
                Single Player
            </TronButton>
            
            <TronButton 
                variant="large"
                on:click={() => startGame('local-multiplayer')}
                disabled={isTouch}
                class={isTouch ? 'opacity-70' : ''}
            >
                {#if isTouch}
                    Local Multiplayer (Desktop Only)
                {:else}
                    Local Multiplayer
                {/if}
            </TronButton>
            
            <TronButton 
                variant="large"
                on:click={() => startGame('ai')}
                disabled
                class="opacity-70"
            >
                VS Computer (Coming Soon)
            </TronButton>
        </div>
    </div>
</div>

<SettingsDialog 
    open={showSettings}
    onOpenChange={(open) => showSettings = open}
/> 