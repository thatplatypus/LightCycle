<script lang="ts">
    import { debug } from '$lib/utils/debug';
    import { writable } from 'svelte/store';
    
    const messages = writable<string[]>([]);
    const MAX_MESSAGES = 10;
    let visible = false;

    // Subscribe to debug messages
    debug.subscribe((msg) => {
        messages.update(msgs => {
            const newMsgs = [...msgs, msg];
            if (newMsgs.length > MAX_MESSAGES) {
                newMsgs.shift();
            }
            return newMsgs;
        });
    });
</script>

<!-- Double tap corner to show/hide -->
<div 
    class="fixed top-0 left-0 w-16 h-16 z-50"
    on:dblclick={() => visible = !visible}
/>

{#if visible}
    <div class="fixed bottom-0 left-0 right-0 bg-black/80 text-cyan-400 p-4 font-mono text-xs z-50 max-h-48 overflow-y-auto">
        {#each $messages as message}
            <div>{message}</div>
        {/each}
    </div>
{/if} 