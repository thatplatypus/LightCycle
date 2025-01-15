<script lang="ts">
    import { onMount } from 'svelte';
    
    export let color = '#18CAE6';
    export let gridSize = 100;
    export let speed = 0.75;
    export let perspective = 180;
</script>

<div class="tron-grid-container" style="perspective: {perspective}px;">
    <!-- Background gradient -->
    <div class="background-gradient"></div>
    
    <!-- Grid with fade -->
    <div 
        class="tron-grid"
        style="
            background-image: 
                linear-gradient({color} 3px, transparent 3px), 
                linear-gradient(90deg, {color} 3px, transparent 3px);
            background-size: {gridSize}px {gridSize}px;
        "
    ></div>
    
    <!-- Horizon glow -->
    <div class="horizon-glow"></div>
</div>

<style>
    .tron-grid-container {
        width: 100%;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
        margin: 0;
        perspective-origin: 50% 50%;
        z-index: -1;
        background: #0C141F;
        overflow: hidden;
    }

    .background-gradient {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            to bottom,
            rgba(24, 202, 230, 0) 0%,
            rgba(24, 202, 230, 0.1) 45%,
            rgba(24, 202, 230, 0.2) 48%,
            rgba(24, 202, 230, 0.4) 50%,
            rgba(24, 202, 230, 0.2) 52%,
            rgba(24, 202, 230, 0.1) 55%,
            rgba(24, 202, 230, 0) 100%
        );
        z-index: 1;
    }

    .horizon-glow {
        position: absolute;
        width: 100%;
        height: 2px;
        top: 50%;
        transform: translateY(-50%);
        background: var(--primary);
        box-shadow: 
            0 0 10px var(--primary),
            0 0 20px var(--primary),
            0 0 30px var(--primary);
        opacity: 0.5;
        z-index: 2;
    }

    .tron-grid {
        width: 200%;
        height: 130%;
        position: absolute;
        bottom: -30%;
        left: -50%;
        background-position: -1px -1px, -1px -1px;
        transform: rotateX(85deg);
        transform-origin: 50% 100%;
        animation: planeMove 0.75s linear infinite;
        will-change: transform, background-position;
        opacity: 0.8;
        backface-visibility: hidden;
        transform-style: preserve-3d;
        animation: 
            planeMove 0.75s linear infinite,
            fadeIn 0.3s ease-out;
    }

    .tron-grid::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.8) 40%,
            rgba(0, 0, 0, 1) 50%
        );
        pointer-events: none;
        transform: translateZ(0);
        backface-visibility: hidden;
    }

    @keyframes planeMove {
        from {
            background-position: 0px 0px, 0px 0px;
        }
        to {
            background-position: 0px 100px, 0px 0px;
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 0.8;
        }
    }
</style> 