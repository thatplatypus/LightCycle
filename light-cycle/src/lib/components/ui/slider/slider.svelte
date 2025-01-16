<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	type $$Props = SliderPrimitive.Props;

	let className: $$Props["class"] = undefined;
	export let value: $$Props["value"] = [0];
	export { className as class };

	// Generate unique ID for this slider instance
	const sliderId = crypto.randomUUID();

	// Track if this specific thumb is being dragged
	let isDragging = false;
	let dragTimeout: NodeJS.Timeout;
	let lastValue = [...value]; // Create a copy of the initial value

	// Watch value changes for this specific instance
	$: if (!arraysEqual(value, lastValue)) {
		console.log(`[Slider ${sliderId}] Value changed from ${lastValue} to ${value}`);
		lastValue = [...value]; // Create a copy of the new value
		isDragging = true;
		
		if (dragTimeout) clearTimeout(dragTimeout);
		
		dragTimeout = setTimeout(() => {
			console.log(`[Slider ${sliderId}] Value settled`);
			isDragging = false;
		}, 6005);
	}

	// Helper function to compare arrays
	function arraysEqual(a: number[], b: number[]): boolean {
		return a.length === b.length && 
			a.every((val, index) => val === b[index]);
	}

	// Clean up timeout on component destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (dragTimeout) clearTimeout(dragTimeout);
	});

	// Add prop for track color
	export let trackColor = "cyan";
</script>

<SliderPrimitive.Root
	bind:value
	class={cn("relative flex w-full touch-none select-none items-center", className)}
	{...$$restProps}
	let:thumbs
>
	<!-- Track background with grid effect -->
	<span 
		class="relative h-3 w-full grow overflow-hidden rounded-full 
		bg-black/90 backdrop-blur-sm
		before:absolute before:inset-0 
		before:bg-[linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px)]
		before:bg-[size:20px_20px]
		after:absolute after:inset-0 after:bg-gradient-to-r 
		after:from-transparent after:via-cyan-500/5 after:to-transparent"
	>
		<!-- Active range with stronger glow -->
		<SliderPrimitive.Range 
			class={cn(
				"absolute h-full bg-cyan-500/90",
				"shadow-[0_0_20px_rgba(0,255,255,0.7),inset_0_0_15px_rgba(0,255,255,0.5)]",
				"transition-all duration-1000",
				isDragging && [
					"animate-[pulse_2s_ease-in-out_infinite]",
					"bg-cyan-400/90",
					"shadow-[0_0_30px_rgba(0,255,255,0.8),inset_0_0_20px_rgba(0,255,255,0.6)]"
				]
			)}
		/>

		<!-- Add subtle border glow -->
		<div class="absolute inset-0 rounded-full border border-cyan-500/30 shadow-[0_0_5px_rgba(0,255,255,0.2)]" />
	</span>

	<!-- Enhanced thumbs -->
	{#each thumbs as thumb}
		<SliderPrimitive.Thumb
			{thumb}
			class={cn(
				"block h-6 w-6 rounded-full",
				"border-2 border-cyan-400 bg-black",
				"shadow-[0_0_15px_rgba(0,255,255,0.4),inset_0_0_10px_rgba(0,255,255,0.3)]",
				"transition-all duration-200",
				"hover:border-cyan-300",
				"hover:shadow-[0_0_25px_rgba(0,255,255,0.6),inset_0_0_15px_rgba(0,255,255,0.5)]",
				"hover:scale-110",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
				"focus-visible:ring-offset-2 focus-visible:ring-offset-black",
				"disabled:pointer-events-none disabled:opacity-50",
				"data-[dragging=true]:border-cyan-300",
				"data-[dragging=true]:shadow-[0_0_30px_rgba(0,255,255,0.8),inset_0_0_20px_rgba(0,255,255,0.6)]",
				"data-[dragging=true]:scale-110"
			)}
		/>
	{/each}
</SliderPrimitive.Root>

<style>
	/* Enhanced scan line effect */
	span::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			transparent 0%,
			rgba(0, 255, 255, 0.15) 50%,
			transparent 100%
		);
		animation: scan 4.5s linear infinite;
	}

	@keyframes scan {
		from { transform: translateY(-100%); }
		to { transform: translateY(100%); }
	}

	/* Add subtle pulse to grid */
	@keyframes gridPulse {
		0%, 100% { opacity: 0.05; }
		50% { opacity: 0.1; }
	}

	span::before {
		animation: gridPulse 4s ease-in-out infinite;
	}
</style>
