import { writable } from 'svelte/store';
import type { AudioState } from '$lib/types/audio';

export const audioState = writable<AudioState>({
    backgroundMusicStarted: false,
    gameAudioStarted: false
}); 