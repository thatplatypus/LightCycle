<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { gameState } from '$lib/stores/game-state';
    import { settings } from '$lib/stores/settings';
    import { fade } from 'svelte/transition';
    import { get } from 'svelte/store';
    import TronButton from '$lib/components/ui/tron-button.svelte';
    import { restartGame } from '$lib/stores/game-state';

    // Get winner message based on game mode and winner
    $: winnerMessage = () => {
        const settingsStore = get(settings);
        if (settingsStore.gameMode === 'single') {
            return `Score: ${$gameState.score}`;
        }
        
        switch($gameState.winner) {
            case 'player1':
                return 'Player 1 Wins!';
            case 'player2':
                return 'Player 2 Wins!';
            case 'draw':
                return 'Draw!';
            default:
                return '';
        }
    };

    function returnToMenu() {
        gameState.set({
            isPlaying: false,
            isPaused: false,
            gameOver: false,
            score: 0,
            isResetting: false,
            opponent: null
        });
    }

    function playAgain() {
        restartGame();
    }
</script>

<div 
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    transition:fade
>
    <div class="text-primary space-y-8 max-w-lg p-8 border border-primary rounded-lg glow-border">
        <h2 class="text-4xl font-mono text-center mb-4 glow-text">GAME OVER</h2>
        <div class="text-2xl font-mono text-center mb-8 glow-text">
            {winnerMessage()}
        </div>
        
        <div class="grid gap-4">
            <TronButton 
                variant="large"
                on:click={playAgain}
            >
                Play Again
            </TronButton>
            
            <TronButton 
                variant="large"
                on:click={returnToMenu}
            >
                Return to Menu
            </TronButton>
        </div>
    </div>
</div> 