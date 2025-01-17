<script lang="ts">
    import { cn } from '$lib/utils';
    
    export let href: string;
    export let title: string | undefined = undefined;
    export let target: string | undefined = undefined;
    export let rel: string | undefined = undefined;
    export let variant: 'default' | 'large' = 'default';
    let className = '';
    export { className as class };
</script>

<a
    {href}
    {title}
    {target}
    {rel}
    class={cn(
        "text-primary border-primary hover:bg-primary/20 hover:glow-border transition-all duration-200",
        variant === 'large' && "h-16 text-xl",
        variant === 'default' && "h-10",
        "inline-flex items-center justify-center px-4 py-2 rounded-md border",
        className
    )}
>
    <slot />
</a> 