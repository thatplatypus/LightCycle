export interface AudioClip {
    buffer: AudioBuffer;
    source?: AudioBufferSourceNode;
    gainNode?: GainNode;
    isPlaying?: boolean;
}

export interface AudioState {
    backgroundMusicStarted: boolean;
    currentTrack?: string;
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