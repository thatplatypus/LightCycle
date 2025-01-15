import { writable } from 'svelte/store';

interface AudioState {
    backgroundMusicStarted: boolean;
    gameAudioStarted: boolean;
}

export const audioState = writable<AudioState>({
    backgroundMusicStarted: false,
    gameAudioStarted: false
}); 