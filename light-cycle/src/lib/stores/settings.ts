import { writable } from 'svelte/store';

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
    }
};

// Load initial settings from localStorage or use defaults
const storedSettings = localStorage.getItem('lightCycleSettings');
const initialSettings: GameSettings = storedSettings 
    ? JSON.parse(storedSettings)
    : defaultSettings;

export const settings = writable<GameSettings>(initialSettings);

// Subscribe to settings changes and save to localStorage
settings.subscribe(value => {
    localStorage.setItem('lightCycleSettings', JSON.stringify(value));
}); 