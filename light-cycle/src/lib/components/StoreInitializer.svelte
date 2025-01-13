<script lang="ts">
    import { onMount } from 'svelte';
    import { settings } from '$lib/stores/settings';

    onMount(() => {
        const unsubscribe = settings.initialize();
        return unsubscribe;
    });
</script> 