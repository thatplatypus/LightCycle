import { get } from 'svelte/store';
import { settings } from '$lib/stores/settings';
import { browser } from "$app/environment";

type AudioClip = {
    name: string;
    path: string;
    type: 'music' | 'effect';
    baseVolume: number;
    loop?: boolean;
};

const AUDIO_FILES: AudioClip[] = [
    // Background music
    { name: 'background', path: '/audio/background.mp3', type: 'music', baseVolume: 0.5 },
    { name: 'gameplay', path: '/audio/gameplay.mp3', type: 'music', baseVolume: 0.5 },
    { name: 'gameplay-multiplayer', path: '/audio/gameplay-local-multiplayer.mp3', type: 'music', baseVolume: 0.5 },
    
    // Sound effects
    { name: 'lightcycle', path: '/audio/lightcycle.mp3', type: 'effect', baseVolume: 0.3, loop: true },
    // Derezz sounds
    { name: 'derezz-1', path: '/audio/derezz-1.mp3', type: 'effect', baseVolume: 0.7 },
    { name: 'derezz-2', path: '/audio/derezz-2.mp3', type: 'effect', baseVolume: 0.7 },
    { name: 'derezz-3', path: '/audio/derezz-3.mp3', type: 'effect', baseVolume: 0.7 },
    { name: 'derezz-4', path: '/audio/derezz-4.mp3', type: 'effect', baseVolume: 0.7 },
    { name: 'derezz-5', path: '/audio/derezz-5.mp3', type: 'effect', baseVolume: 0.7 },
    { name: 'derezz-6', path: '/audio/derezz-6.mp3', type: 'effect', baseVolume: 0.7 },
];

class AudioManager {
    private clips: Map<string, HTMLAudioElement> = new Map();
    private initialized = false;
    private currentMusic: string | null = null;
    private unsubscribe: (() => void) | null = null;
    private context: AudioContext | null = null;

    async init() {
        if (!browser || this.initialized) return;

        try {
            console.log('[AudioManager] Initializing...');
            
            // Create audio context
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            console.log('[AudioManager] Loading audio files:', AUDIO_FILES.map(f => f.name));
            
            for (const clip of AUDIO_FILES) {
                console.log(`[AudioManager] Loading clip: ${clip.name}`);
                const audio = new Audio(clip.path);
                audio.preload = 'auto';
                
                if (clip.type === 'music') {
                    audio.loop = true;
                }
                
                this.updateVolume(audio, clip);
                this.clips.set(clip.name, audio);

                // Connect to audio context
                const source = this.context.createMediaElementSource(audio);
                source.connect(this.context.destination);
            }

            // Resume audio context if suspended
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            // Wait for all clips to load
            await Promise.all(
                Array.from(this.clips.values()).map(
                    audio => new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', resolve, { once: true });
                        audio.addEventListener('error', (e) => {
                            console.error('[AudioManager] Audio load error:', e);
                            reject(e);
                        }, { once: true });
                        audio.load();
                    })
                )
            );

            this.initialized = true;
            console.log('[AudioManager] Initialization complete. Loaded clips:', Array.from(this.clips.keys()));
        } catch (error) {
            console.error('[AudioManager] Initialization error:', error);
            throw error;
        }
    }

    private updateAllVolumes() {
        AUDIO_FILES.forEach(clip => {
            const audio = this.clips.get(clip.name);
            if (audio) {
                this.updateVolume(audio, clip);
            }
        });
    }

    private updateVolume(audio: HTMLAudioElement, clip: AudioClip) {
        const currentSettings = get(settings);
        const audioSettings = currentSettings.audio;
        
        if (!audioSettings) return;

        const baseVolume = clip.baseVolume;
        const masterVolume = audioSettings.masterVolume ?? 0.7;
        
        if (clip.type === 'music') {
            audio.volume = audioSettings.musicEnabled 
                ? baseVolume * masterVolume * (audioSettings.musicVolume ?? 0.5)
                : 0;
            
            // If music is disabled, pause it
            if (!audioSettings.musicEnabled && this.currentMusic) {
                audio.pause();
            } else if (audioSettings.musicEnabled && this.currentMusic === clip.name && audio.paused) {
                audio.play().catch(error => console.error('Failed to resume music:', error));
            }
        } else {
            audio.volume = audioSettings.effectsEnabled 
                ? baseVolume * masterVolume * (audioSettings.effectsVolume ?? 0.8)
                : 0;
        }
    }

    playMusic(name: string) {
        if (!browser) return;
        
        try {
            console.log(`[AudioManager] Attempting to play music: ${name}`);
            console.log(`[AudioManager] Current music: ${this.currentMusic}`);
            console.log(`[AudioManager] Available clips:`, Array.from(this.clips.keys()));
            
            // Stop current music if playing
            if (this.currentMusic) {
                console.log(`[AudioManager] Stopping current music: ${this.currentMusic}`);
                this.stop(this.currentMusic);
            }

            const audio = this.clips.get(name);
            if (audio) {
                audio.currentTime = 0;
                console.log(`[AudioManager] Starting new music: ${name}`);
                const playPromise = audio.play();
                if (playPromise) {
                    playPromise.catch((error) => {
                        console.error(`[AudioManager] Music playback failed for ${name}:`, error);
                    });
                }
                this.currentMusic = name;
            } else {
                console.warn(`[AudioManager] Audio clip not found: ${name}`);
            }
        } catch (error) {
            console.error(`[AudioManager] Error playing music ${name}:`, error);
        }
    }

    playEffect(name: string) {
        try {
            console.log(`[AudioManager] Playing effect: ${name}`);
            const audio = this.clips.get(name);
            const clip = AUDIO_FILES.find(c => c.name === name);
            
            if (audio && clip) {
                audio.currentTime = 0;
                audio.loop = !!clip.loop;
                this.updateVolume(audio, clip);
                
                const playPromise = audio.play();
                if (playPromise) {
                    playPromise.catch((error) => {
                        console.error(`[AudioManager] Effect playback failed for ${name}:`, error);
                    });
                }
            } else {
                console.warn(`[AudioManager] Effect clip not found: ${name}`);
            }
        } catch (error) {
            console.error(`[AudioManager] Error playing effect ${name}:`, error);
        }
    }

    stop(name: string) {
        console.log(`[AudioManager] Stopping audio: ${name}`);
        const audio = this.clips.get(name);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            if (name === this.currentMusic) {
                this.currentMusic = null;
            }
        } else {
            console.warn(`[AudioManager] Cannot stop - clip not found: ${name}`);
        }
    }

    stopAll() {
        console.log('[AudioManager] Stopping all audio');
        this.clips.forEach((audio, name) => {
            console.log(`[AudioManager] Stopping: ${name}`);
            audio.pause();
            audio.currentTime = 0;
        });
        this.currentMusic = null;
    }

    // Clean up subscription when needed
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.stopAll();
    }

    playRandomDerezz() {
        const randomNum = Math.floor(Math.random() * 6) + 1;
        const derezzSound = `derezz-${randomNum}`;
        console.log(`[AudioManager] Playing random derezz sound: ${derezzSound}`);
        this.playEffect(derezzSound);
    }
}

export const audioManager = new AudioManager(); 