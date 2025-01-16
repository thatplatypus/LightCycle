<script lang="ts">
    import { cn } from "$lib/utils";
    import { debug } from '$lib/utils/debug';
    
    export let value: string = "#000000";
    export let label: string = "";
    export let className: string = undefined;
    
    let id = crypto.randomUUID();
    let isActive = false;
    let isHovered = false;
    let inputElement: HTMLInputElement;

    function handleClick() {
        debug.log('[ColorPicker] Click detected');
        inputElement?.click();
    }

    function handleInputClick(event: Event) {
        debug.log('[ColorPicker] Input clicked', event);
    }
</script>

<div class={cn("relative flex items-center gap-4", className)}>
    {#if label}
        <label 
            for={id}
            class="text-cyan-400 min-w-32 cursor-pointer hover:text-cyan-300 transition-colors"
            on:click={handleClick}
        >
            {label}
        </label>
    {/if}
    
    <!-- Make the whole container clickable -->
    <button
        type="button"
        on:click={handleClick}
        class="group relative w-full h-10 rounded-md overflow-hidden
        bg-black/90 backdrop-blur-sm
        before:absolute before:inset-0 
        before:bg-[linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px)]
        before:bg-[size:20px_20px]
        before:animate-gridPulse"
        on:mouseenter={() => isHovered = true}
        on:mouseleave={() => isHovered = false}
    >
        <!-- Color preview -->
        <div 
            class="absolute inset-0 transition-opacity duration-300"
            class:opacity-50={!isHovered}
            class:opacity-70={isHovered}
            style:background-color={value}
        />

        <!-- Border glow effect -->
        <div class="absolute inset-0 rounded-md border border-cyan-500/30 
            shadow-[0_0_5px_rgba(0,255,255,0.2)]
            group-hover:border-cyan-400/50
            group-hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]
            transition-all duration-300"
        />

        <!-- Hidden input -->
        <input
            bind:this={inputElement}
            type="color"
            id={id}
            bind:value
            class="sr-only"
            on:focus={() => isActive = true}
            on:blur={() => isActive = false}
            on:click={handleInputClick}
        />
            
        <!-- Click indicator -->
        <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-cyan-400/70 opacity-0 group-hover:opacity-100 transition-all duration-300 
                transform group-hover:scale-110 pointer-events-none select-none font-mono text-sm">
                Click to change color
            </div>
        </div>

        <!-- Active state glow -->
        {#if isActive}
            <div class="absolute inset-0 
                shadow-[inset_0_0_20px_rgba(0,255,255,0.4)]
                animate-[pulse_2s_ease-in-out_infinite]"
            />
        {/if}

        <!-- Hover animation -->
        {#if isHovered}
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent
                animate-[shimmer_2s_linear_infinite]" />
        {/if}
    </button>
</div>

<style>
    @keyframes gridPulse {
        0%, 100% { opacity: 0.05; }
        50% { opacity: 0.1; }
    }

    @keyframes shimmer {
        from { transform: translateX(-100%); }
        to { transform: translateX(100%); }
    }

    /* Make the color picker dialog match our theme */
    :global(input[type="color"]::-webkit-color-swatch-wrapper) {
        padding: 0;
    }
    :global(input[type="color"]::-webkit-color-swatch) {
        border: none;
        border-radius: 4px;
    }
</style> 