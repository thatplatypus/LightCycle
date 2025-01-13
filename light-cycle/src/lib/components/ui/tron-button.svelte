<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { cn } from '$lib/utils';
    import { createEventDispatcher } from 'svelte';
    
    export let variant: 'default' | 'large' = 'default';
    let className = '';
    export { className as class };

    const dispatch = createEventDispatcher();

    function handleClick(event: MouseEvent) {
        dispatch('click', event);
    }
</script>

<Button 
    variant="outline"
    class={cn(
        "text-primary border-primary hover:bg-primary/20 hover:glow-border transition-all duration-200",
        variant === 'large' && "h-16 text-xl",
        variant === 'default' && "h-10",
        className
    )}
    on:click={handleClick}
    {...$$restProps}
>
    <slot />
</Button> 