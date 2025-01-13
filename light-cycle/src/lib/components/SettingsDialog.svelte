<script lang="ts">
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import { Button } from "$lib/components/ui/button";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select/index";
    import { Slider } from "$lib/components/ui/slider";
    import { Input } from "$lib/components/ui/input";
    import { settings } from '$lib/stores/settings';
    import { gameState } from '$lib/stores/game-state';

    export let open = false;
    export let onOpenChange: (open: boolean) => void;

    let tempSettings = { ...$settings };  // Create a temporary copy

    function handleSave() {
        settings.set(tempSettings);  // Apply all changes at once
        onOpenChange(false);
    }

    function handleCancel() {
        tempSettings = { ...$settings };  // Reset to original values
        onOpenChange(false);
    }

    // Reset temp settings when dialog opens
    $: if (open) {
        tempSettings = { ...$settings };
    }

    // Pause game when dialog opens
    $: if (open) {
        gameState.update(state => ({ ...state, isPaused: true }));
    } else {
        gameState.update(state => ({ ...state, isPaused: false }));
    }
</script>

<Dialog {open} onOpenChange={onOpenChange}>
    <DialogContent class="sm:max-w-[425px] md:max-w-[800px] bg-black border-primary text-primary">
        <DialogHeader>
            <DialogTitle class="text-primary text-2xl font-mono">Game Settings</DialogTitle>
        </DialogHeader>

        <div class="grid gap-4 py-4">
            <!-- Game Mode -->
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Game Mode</Label>
                <div class="col-span-3">
                    <Select 
                        value={tempSettings.gameMode}
                        onValueChange={(value: 'single' | 'local-multiplayer') => tempSettings.gameMode = value}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select game mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="single">Single Player</SelectItem>
                            <SelectItem value="local-multiplayer">Local Multiplayer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

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

            {#if $settings.gameMode === 'local-multiplayer'}
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Player 2 Color</Label>
                    <Input 
                        type="color" 
                        value={$settings.player2Color}
                        on:input={(e) => $settings.player2Color = e.currentTarget.value}
                        class="col-span-3 h-10 px-3"
                    />
                </div>
            {/if}

            <!-- Power-Ups Section -->
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Power-Ups</Label>
                <Switch 
                    checked={$settings.powerUpsEnabled}
                    onCheckedChange={(checked: boolean) => $settings.powerUpsEnabled = checked}
                    class="col-span-3"
                />
            </div>

            {#if $settings.powerUpsEnabled}
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Speed Boost</Label>
                    <Switch 
                        checked={$settings.powerUps.speedBoost}
                        onCheckedChange={(checked: boolean) => $settings.powerUps.speedBoost = checked}
                        class="col-span-3"
                    />
                </div>
                <!-- Add other power-ups here -->
            {/if}
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