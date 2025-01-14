import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['src/test/setup.ts'],
		deps: {
			inline: ['@sveltejs/kit']
		}
	}
});
