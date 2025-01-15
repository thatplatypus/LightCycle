<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import { audioManager } from '$lib/audio/manager';
    import { settings } from '$lib/stores/settings';
    import { gameState } from '$lib/stores/game-state';
    import { audioState } from '$lib/stores/audio-state';
    
    let lightcycleSound: string | null = null;
    let mounted = false;

    onMount(() => {
        mounted = true;
        console.log('[Game] Component mounted');
        startGameAudio();
    });

    function startGameAudio() {
        console.log('[Game] Starting game audio sequence');
        const gameMode = $settings.gameMode;
        const musicTrack = gameMode === 'local-multiplayer' ? 'gameplay-multiplayer' : 'gameplay';
        
        console.log(`[Game] Starting ${gameMode} mode with track: ${musicTrack}`);
        
        // Stop all current audio including background music
        audioManager.stopAll();
        
        // Start new game music
        setTimeout(() => {
            audioManager.playMusic(musicTrack);
            startLightcycleSound();
        }, 100);
    }

    // Handle game state changes
    $: if ($gameState.gameOver && mounted) {
        console.log('[Game] Game over - playing derezz sound');
        // Stop game music and lightcycle sound
        audioManager.stopAll();
        // Play random derezz sound
        audioManager.playRandomDerezz();
    }

    $: if ($gameState.isPaused && mounted) {
        console.log('[Game] Game paused');
        stopLightcycleSound();
    } else if (!$gameState.isPaused && mounted && !$gameState.gameOver && !lightcycleSound) {
        console.log('[Game] Game resumed');
        startLightcycleSound();
    }

    function startLightcycleSound() {
        console.log('[Game] Starting lightcycle sound');
        if (!lightcycleSound && !$gameState.gameOver) {
            audioManager.playEffect('lightcycle');
            lightcycleSound = 'lightcycle';
        }
    }

    function stopLightcycleSound() {
        console.log('[Game] Stopping lightcycle sound');
        if (lightcycleSound) {
            audioManager.stop(lightcycleSound);
            lightcycleSound = null;
        }
    }

    onDestroy(() => {
        console.log('[Game] Component destroying - cleaning up sounds');
        mounted = false;
        stopLightcycleSound();
        
        // If game isn't over (e.g., navigating away), stop all audio
        if (!$gameState.gameOver) {
            audioManager.stopAll();
        }
    });
</script>

<div class="relative">
    <slot></slot>
</div> 