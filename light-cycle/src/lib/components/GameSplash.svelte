<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { settings } from '$lib/stores/settings';
    import { gameState } from '$lib/stores/game-state';

    function startGame(mode: 'single' | 'local-multiplayer' | 'ai') {
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

<div class="fixed inset-0 flex items-center justify-center bg-black z-50">
    <div class="text-primary space-y-8 max-w-lg p-8">
        <h1 class="text-4xl font-mono text-center mb-12 glow-text">LIGHT CYCLE</h1>
        
        <div class="grid gap-4">
            <Button 
                variant="outline" 
                class="text-primary border-primary hover:bg-primary/20 h-16 text-xl"
                on:click={() => startGame('single')}
            >
                Single Player
            </Button>
            
            <Button 
                variant="outline" 
                class="text-primary border-primary hover:bg-primary/20 h-16 text-xl"
                on:click={() => startGame('local-multiplayer')}
            >
                Local Multiplayer
            </Button>
            
            <Button 
                variant="outline" 
                class="text-primary border-primary hover:bg-primary/20 h-16 text-xl opacity-70"
                on:click={() => startGame('ai')}
                disabled
            >
                VS Computer (Coming Soon)
            </Button>
        </div>
    </div>
</div> 