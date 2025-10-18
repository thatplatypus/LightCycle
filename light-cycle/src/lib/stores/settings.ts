import { writable } from 'svelte/store';
import { browser } from "$app/environment"


export interface Settings {
    playerSpeed: number;
    player1Color: string;
    player2Color: string;
    soundEnabled: boolean;
    musicVolume: number;
    effectsVolume: number;
    gameMode: 'single' | 'local-multiplayer' | 'ai';
    controls: {
        player1: {
            up: string;
            right: string;
            down: string;
            left: string;
        };
        player2: {
            up: string;
            right: string;
            down: string;
            left: string;
        };
    };
}

const defaultSettings: Settings = {
    playerSpeed: 5,
    player1Color: '#00ff00',
    player2Color: '#ff0000',
    soundEnabled: true,
    musicVolume: 0.5,
    effectsVolume: 0.7,
    gameMode: 'single',
    controls: {
        player1: {
            up: 'w',
            right: 'd',
            down: 's',
            left: 'a'
        },
        player2: {
            up: 'ArrowUp',
            right: 'ArrowRight',
            down: 'ArrowDown',
            left: 'ArrowLeft'
        }
    }
};

// Load initial settings from localStorage or use defaults
const storedSettings = browser ? localStorage.getItem('lightCycleSettings') : null;
const initialSettings: Settings = storedSettings 
    ? JSON.parse(storedSettings)
    : defaultSettings;

export const settings = writable<Settings>(initialSettings);

// Subscribe to settings changes and save to localStorage
settings.subscribe(value => {
    if(!browser) return;
    
    localStorage.setItem('lightCycleSettings', JSON.stringify(value));
}); 