<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		if (browser && 'serviceWorker' in navigator) {
			navigator.serviceWorker
				.register(`${base}/service-worker.js`)
				.then((registration) => {
					console.log('Service Worker registered:', registration);
				})
				.catch((error) => {
					console.error('Service Worker registration failed:', error);
				});
		}
	});
</script>

<slot />
