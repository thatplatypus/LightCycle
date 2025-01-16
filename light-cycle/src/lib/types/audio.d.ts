export interface AudioClip {
    name: string;
    path: string;
    type: 'music' | 'effect';
    baseVolume: number;
    loop?: boolean;
}

export interface AudioState {
    backgroundMusicStarted: boolean;
    gameAudioStarted: boolean;
}

export type AudioClipName = 
    | 'background'
    | 'gameplay'
    | 'gameplay-multiplayer'
    | 'lightcycle'
    | 'derezz-1'
    | 'derezz-2'
    | 'derezz-3'
    | 'derezz-4'
    | 'derezz-5'
    | 'derezz-6'; 