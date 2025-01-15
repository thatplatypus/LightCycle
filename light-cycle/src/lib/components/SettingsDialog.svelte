<script lang="ts">
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Slider } from "$lib/components/ui/slider";
    import { settings } from '$lib/stores/settings';
    import { gameState } from '$lib/stores/game-state';
    import TronButton from './ui/tron-button.svelte';
    import { Volume2, VolumeX } from 'lucide-svelte';

    export let open = false;
    export let onOpenChange: (open: boolean) => void;

    // Initialize with default audio settings
    let tempSettings = {
        ...$settings,
        audio: {
            masterVolume: 0.7,
            musicVolume: 0.5,
            effectsVolume: 0.8,
            musicEnabled: true,
            effectsEnabled: true,
            ...$settings.audio // This will override defaults if settings exist
        }
    };

    function handleSave() {
        settings.set(tempSettings);
        onOpenChange(false);
    }

    function handleCancel() {
        tempSettings = {
            ...$settings,
            audio: {
                masterVolume: 0.7,
                musicVolume: 0.5,
                effectsVolume: 0.8,
                musicEnabled: true,
                effectsEnabled: true,
                ...$settings.audio
            }
        };
        onOpenChange(false);
    }

    // Reset temp settings when dialog opens
    $: if (open) {
        tempSettings = {
            ...$settings,
            audio: {
                masterVolume: 0.7,
                musicVolume: 0.5,
                effectsVolume: 0.8,
                musicEnabled: true,
                effectsEnabled: true,
                ...$settings.audio
            }
        };
    }

    // Pause game when dialog opens during gameplay
    $: if (open && $gameState.isPlaying) {
        gameState.update(state => ({ ...state, isPaused: true }));
    }

    // Helper for toggling audio
    function toggleMusic() {
        tempSettings = {
            ...tempSettings,
            audio: {
                ...tempSettings.audio,
                musicEnabled: !tempSettings.audio.musicEnabled
            }
        };
    }

    function toggleEffects() {
        tempSettings = {
            ...tempSettings,
            audio: {
                ...tempSettings.audio,
                effectsEnabled: !tempSettings.audio.effectsEnabled
            }
        };
    }
</script>

<Dialog {open} onOpenChange={onOpenChange}>
    <DialogContent class="sm:max-w-[425px] md:max-w-[800px] bg-black border-primary text-primary">
        <DialogHeader>
            <DialogTitle class="text-primary text-2xl font-mono">Game Settings</DialogTitle>
        </DialogHeader>

        <div class="grid gap-4 py-4">
            <!-- Player Speed -->
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Speed</Label>
                <div class="col-span-3 flex items-center gap-4">
                    <Slider
                        value={[tempSettings.playerSpeed]}
                        onValueChange={([value]) => tempSettings.playerSpeed = value}
                        min={1}
                        max={10}
                        step={1}
                        class="flex-1"
                    />
                    <span class="w-12 text-center">{tempSettings.playerSpeed}</span>
                </div>
            </div>

            <!-- Player Colors -->
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Player 1 Color</Label>
                <Input 
                    type="color" 
                    value={tempSettings.player1Color}
                    on:input={(e) => tempSettings.player1Color = e.currentTarget.value}
                    class="col-span-3 h-10 px-3"
                />
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Player 2 Color</Label>
                <Input 
                    type="color" 
                    value={tempSettings.player2Color}
                    on:input={(e) => tempSettings.player2Color = e.currentTarget.value}
                    class="col-span-3 h-10 px-3"
                />
            </div>

            <!-- Audio Settings Section -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold">Audio</h3>
                
                <!-- Master Volume -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label for="master-volume">Master Volume</label>
                        <span>{Math.round(tempSettings.audio.masterVolume * 100)}%</span>
                    </div>
                    <Slider 
                        id="master-volume"
                        value={[tempSettings.audio.masterVolume * 100]} 
                        onValueChange={([value]) => {
                            tempSettings = {
                                ...tempSettings,
                                audio: { ...tempSettings.audio, masterVolume: value / 100 }
                            };
                        }}
                        max={100}
                        step={1}
                        class="w-full"
                    />
                </div>

                <!-- Music Controls -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label for="music-volume">Music Volume</label>
                        <TronButton 
                            variant="icon"
                            title={tempSettings.audio.musicEnabled ? "Mute Music" : "Unmute Music"}
                            on:click={toggleMusic}
                        >
                            {#if tempSettings.audio.musicEnabled}
                                <Volume2 class="w-4 h-4" />
                            {:else}
                                <VolumeX class="w-4 h-4" />
                            {/if}
                        </TronButton>
                    </div>
                    <Slider 
                        id="music-volume"
                        value={[tempSettings.audio.musicVolume * 100]}
                        onValueChange={([value]) => {
                            tempSettings = {
                                ...tempSettings,
                                audio: { ...tempSettings.audio, musicVolume: value / 100 }
                            };
                        }}
                        max={100}
                        step={1}
                        class="w-full {!tempSettings.audio.musicEnabled ? 'opacity-50' : ''}"
                        disabled={!tempSettings.audio.musicEnabled}
                    />
                </div>

                <!-- Effects Controls -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label for="effects-volume">Effects Volume</label>
                        <TronButton 
                            variant="icon"
                            title={tempSettings.audio.effectsEnabled ? "Mute Effects" : "Unmute Effects"}
                            on:click={toggleEffects}
                        >
                            {#if tempSettings.audio.effectsEnabled}
                                <Volume2 class="w-4 h-4" />
                            {:else}
                                <VolumeX class="w-4 h-4" />
                            {/if}
                        </TronButton>
                    </div>
                    <Slider 
                        id="effects-volume"
                        value={[tempSettings.audio.effectsVolume * 100]}
                        onValueChange={([value]) => {
                            tempSettings = {
                                ...tempSettings,
                                audio: { ...tempSettings.audio, effectsVolume: value / 100 }
                            };
                        }}
                        max={100}
                        step={1}
                        class="w-full"
                        disabled={!tempSettings.audio.effectsEnabled}
                    />
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-4 mt-4">
            <Button 
                variant="outline" 
                class="text-primary border-primary hover:bg-primary/20"
                on:click={handleCancel}
            >
                Cancel
            </Button>
            <Button 
                variant="outline" 
                class="text-primary border-primary hover:bg-primary/20"
                on:click={handleSave}
            >
                Save Changes
            </Button>
        </div>
    </DialogContent>
</Dialog> 