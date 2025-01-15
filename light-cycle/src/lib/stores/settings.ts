import { writable } from 'svelte/store';
import { browser } from "$app/environment"


interface GameSettings {
    gameMode: 'single' | 'local-multiplayer';
    playerSpeed: number;
    player1Color: string;
    player2Color: string;
    powerUpsEnabled: boolean;
    powerUps: {
        speedBoost: boolean;
        shield: boolean;
        ghostMode: boolean;
        // Add more power-ups here
    };
    controls: {
        player1: {
            up: string;
            down: string;
            left: string;
            right: string;
        };
        player2: {
            up: string;
            down: string;
            left: string;
            right: string;
        };
    };
    audio: {
        masterVolume: number;
        musicVolume: number;
        effectsVolume: number;
        musicEnabled: boolean;
        effectsEnabled: boolean;
    };
}

const defaultSettings: GameSettings = {
    gameMode: 'single',
    playerSpeed: 5,
    player1Color: '#00ff00',
    player2Color: '#ff0000',
    powerUpsEnabled: false,
    powerUps: {
        speedBoost: false,
        shield: false,
        ghostMode: false
    },
    controls: {
        player1: {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight'
        },
        player2: {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd'
        }
    },
    audio: {
        masterVolume: 0.7,
        musicVolume: 0.5,
        effectsVolume: 0.8,
        musicEnabled: true,
        effectsEnabled: true
    }
};

// Load initial settings from localStorage or use defaults
const storedSettings = browser ? localStorage.getItem('lightCycleSettings') : null;
const initialSettings: GameSettings = storedSettings 
    ? JSON.parse(storedSettings)
    : defaultSettings;

export const settings = writable<GameSettings>(initialSettings);

// Subscribe to settings changes and save to localStorage
settings.subscribe(value => {
    if(!browser) return;
    
    localStorage.setItem('lightCycleSettings', JSON.stringify(value));
}); 