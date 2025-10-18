import * as PIXI from 'pixi.js';
import { Player, Direction } from './player';
import { AIPlayer } from './ai-player-store';
import { get } from 'svelte/store';
import { gameState, updatePlayer1Info, updatePlayer2Info, updateGameBounds } from '$lib/stores/game-state';
import { settings } from '$lib/stores/settings';
import { GlowFilter } from '@pixi/filter-glow';
import { TouchController } from './touch-controller';

export class GameEngine {
    private app!: PIXI.Application;
    private gameContainer!: PIXI.Container;
    private player1: Player | null = null;
    private player2: Player | null = null;
    private initialized = false;
    private touchController: TouchController;

    constructor(canvas: HTMLCanvasElement) {
        this.initializeApp(canvas);
    }

    private async initializeApp(canvas: HTMLCanvasElement) {
        this.app = new PIXI.Application();
        
        await this.app.init({
            view: canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            antialias: true,
            powerPreference: 'high-performance'
        });

        // Enable sorting on stage
        this.app.stage.sortableChildren = true;

        // Draw background grid
        this.drawBackground();

        // Create game container
        this.gameContainer = new PIXI.Container();
        this.gameContainer.sortableChildren = true;
        this.gameContainer.zIndex = 1;
        this.app.stage.addChild(this.gameContainer);

        // Debug: Log renderer info
        console.log('Renderer:', this.app.renderer.type);
        console.log('Canvas size:', this.app.renderer.width, 'x', this.app.renderer.height);

        // Handle resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Handle keyboard input
        window.addEventListener('keydown', this.handleKeydown.bind(this));

        // Initialize touch controls
        this.touchController = new TouchController(
            this.app.view as HTMLCanvasElement,
            this.handleSwipe.bind(this)
        );

        this.initialized = true;
    }

    private handleKeydown(event: KeyboardEvent): void {
        const settingsStore = get(settings);
        
        // Player 1 controls
        if (this.player1) {
            // In AI mode and single player mode, player 1 uses arrow keys
            if (settingsStore.gameMode === 'ai' || settingsStore.gameMode === 'single') {
                if (event.key === 'ArrowUp') this.player1.setDirection(Direction.UP);
                if (event.key === 'ArrowRight') this.player1.setDirection(Direction.RIGHT);
                if (event.key === 'ArrowDown') this.player1.setDirection(Direction.DOWN);
                if (event.key === 'ArrowLeft') this.player1.setDirection(Direction.LEFT);
            } else {
                // In multiplayer mode, use configured controls
                if (event.key === settingsStore.controls.player1.up) this.player1.setDirection(Direction.UP);
                if (event.key === settingsStore.controls.player1.right) this.player1.setDirection(Direction.RIGHT);
                if (event.key === settingsStore.controls.player1.down) this.player1.setDirection(Direction.DOWN);
                if (event.key === settingsStore.controls.player1.left) this.player1.setDirection(Direction.LEFT);
            }
        }

        // Player 2 controls (only in multiplayer)
        if (settingsStore.gameMode === 'local-multiplayer' && this.player2) {
            if (event.key === settingsStore.controls.player2.up) this.player2.setDirection(Direction.UP);
            if (event.key === settingsStore.controls.player2.right) this.player2.setDirection(Direction.RIGHT);
            if (event.key === settingsStore.controls.player2.down) this.player2.setDirection(Direction.DOWN);
            if (event.key === settingsStore.controls.player2.left) this.player2.setDirection(Direction.LEFT);
        }
    }

    private handleResize(): void {
        if (this.app?.renderer) {
            const renderer = this.app.renderer;
            renderer.resize(window.innerWidth, window.innerHeight);
        }
    }

    private checkBoundaryCollision(player: Player): boolean {
        const pos = player.getPosition();
        const bounds = this.app.renderer.screen;
        
        return (
            pos.x < 0 || 
            pos.x > bounds.width || 
            pos.y < 0 || 
            pos.y > bounds.height
        );
    }

    private gameLoop = (deltaTime: PIXI.Ticker): void => {
        if (!this.player1) return; // Early return if game isn't properly initialized
        
        const delta = deltaTime.deltaTime;
        const gameStateValue = get(gameState);
        if (gameStateValue.isPaused || gameStateValue.gameOver) return;

        let collision = false;
        
        // Update player 1
        collision = this.player1.update(delta);
        if (collision || this.checkBoundaryCollision(this.player1)) {
            this.handleGameOver('player2');
            return;
        }

        // Update game state with player 1 info
        updatePlayer1Info(
            this.player1.getPosition(),
            this.player1.direction,
            this.player1.getTrailPoints(),
            true
        );

        // Update player 2 only if it exists
        if (this.player2) {
            collision = this.player2.update(delta);
            if (collision || this.checkBoundaryCollision(this.player2)) {
                this.handleGameOver('player1');
                return;
            }

            // Update game state with player 2 info
            updatePlayer2Info(
                this.player2.getPosition(),
                this.player2.direction,
                this.player2.getTrailPoints(),
                true
            );

            // Check cross-collisions
            if (this.player2.checkCollisionWithPoint(this.player1.getPosition())) {
                this.handleGameOver('player2');
                return;
            }
            if (this.player1.checkCollisionWithPoint(this.player2.getPosition())) {
                this.handleGameOver('player1');
                return;
            }

            // Head-on collision check
            if (this.checkHeadOnCollision()) {
                this.handleGameOver('draw');
                return;
            }
        }
    };

    private checkHeadOnCollision(): boolean {
        if (!this.player1 || !this.player2) return false;
        
        const p1Pos = this.player1.getPosition();
        const p2Pos = this.player2.getPosition();
        const dx = p1Pos.x - p2Pos.x;
        const dy = p1Pos.y - p2Pos.y;
        return Math.sqrt(dx * dx + dy * dy) < 10;
    }

    private checkPlayerCollision(): boolean {
        if (!this.player1 || !this.player2) return false;

        const p1Pos = this.player1.getPosition();
        const p2Pos = this.player2.getPosition();
        
        // Check for head-on collision (when bikes are very close to each other)
        const dx = p1Pos.x - p2Pos.x;
        const dy = p1Pos.y - p2Pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10) {  // If bikes are very close
            this.handleGameOver('draw');
            return true;
        }
        
        // Check player 1 against player 2's trail
        if (this.player2.checkCollisionWithPoint(p1Pos)) {
            this.handleGameOver('player2');
            return true;
        }
        
        // Check player 2 against player 1's trail
        if (this.player1.checkCollisionWithPoint(p2Pos)) {
            this.handleGameOver('player1');
            return true;
        }

        return false;
    }

    public async startGame(): Promise<void> {
        // Wait for initialization to complete
        if (!this.initialized) {
            await new Promise<void>(resolve => {
                const checkInit = () => {
                    if (this.initialized) {
                        resolve();
                    } else {
                        requestAnimationFrame(checkInit);
                    }
                };
                checkInit();
            });
        }

        // Initialize player 1 on the left
        const settingsStore = get(settings);
        const screenHeight = this.app.renderer.screen.height;
        const screenWidth = this.app.renderer.screen.width;

        // Initialize game bounds in the store
        updateGameBounds(screenWidth, screenHeight);

        this.player1 = new Player(
            100,
            screenHeight / 2,
            settingsStore.playerSpeed,
            Direction.RIGHT,
            settingsStore.player1Color,
            1
        );

        // Add player 1's graphics
        const p1ParticleContainer = this.player1.getParticleContainer();
        const p1Trail = this.player1.getTrail();
        const p1Sprite = this.player1.getSprite();

        p1ParticleContainer.zIndex = 1;
        p1Trail.zIndex = 101;
        p1Sprite.zIndex = 100;

        this.gameContainer.addChild(p1ParticleContainer);
        this.gameContainer.addChild(p1Trail);
        this.gameContainer.addChild(p1Sprite);

        // Initialize and add player 2 if in multiplayer or AI mode
        if (settingsStore.gameMode === 'local-multiplayer' || settingsStore.gameMode === 'ai') {
            console.log('Initializing player 2');  // Debug log
            
            if (settingsStore.gameMode === 'ai') {
                // Create AI player - start further from walls
                this.player2 = new AIPlayer(
                    screenWidth - 200, // Increased from 100 to 200
                    screenHeight / 2,
                    settingsStore.playerSpeed,
                    Direction.LEFT,
                    settingsStore.player2Color,
                    2
                );
                
                // Set AI difficulty and bounds
                (this.player2 as AIPlayer).setDifficulty('medium');
                (this.player2 as AIPlayer).updateGameBounds({
                    width: screenWidth,
                    height: screenHeight
                });
            } else {
                // Create human player - start further from walls
                this.player2 = new Player(
                    screenWidth - 200, // Increased from 100 to 200
                    screenHeight / 2,
                    settingsStore.playerSpeed,
                    Direction.LEFT,
                    settingsStore.player2Color,
                    2
                );
            }

            // Add player 2's graphics
            const p2ParticleContainer = this.player2.getParticleContainer();
            const p2Trail = this.player2.getTrail();
            const p2Sprite = this.player2.getSprite();

            p2ParticleContainer.zIndex = 1;
            p2Trail.zIndex = 101;
            p2Sprite.zIndex = 100;

            this.gameContainer.addChild(p2ParticleContainer);
            this.gameContainer.addChild(p2Trail);
            this.gameContainer.addChild(p2Sprite);

            console.log('Player 2 graphics added:', {  // Debug log
                particleContainer: p2ParticleContainer,
                trail: p2Trail,
                sprite: p2Sprite
            });
        }

        // Debug bounds behind everything
        const bounds = new PIXI.Graphics()
            .stroke({ color: 0xFF0000, width: 2 })
            .rect(0, 0, this.app.renderer.width, this.app.renderer.height);
        bounds.zIndex = 0;
        this.gameContainer.addChild(bounds);

        // Start the game loop
        this.app.ticker.add(this.gameLoop);
    }

    public stopGame(): void {
        // Remove event listeners
        window.removeEventListener('keydown', this.handleKeydown);
        window.removeEventListener('resize', this.handleResize);

        // Stop the game loop
        if (this.app?.ticker) {
            this.app.ticker.remove(this.gameLoop);
        }
        
        // Clean up players
        if (this.player1) {
            this.player1.destroy();
            this.player1 = null;
        }
        if (this.player2) {
            this.player2.destroy();
            this.player2 = null;
        }
        
        // Clear game container
        if (this.gameContainer) {
            this.gameContainer.removeChildren();
        }

        // Destroy PIXI application
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
            this.app = null as any;
        }

        this.touchController?.destroy();
    }

    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) | (g << 8) | b;
    }

    private drawBackground() {
        const grid = new PIXI.Graphics();
        grid.zIndex = -1;
        
        const gridSize = 40;
        const width = this.app.screen.width;
        const height = this.app.screen.height;

        // Draw base grid lines
        grid.stroke({ 
            width: 1,
            color: 0x00FFFF,
            alpha: 0.2,
            alignment: 0.5,
            native: true
        });

        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            grid.moveTo(x, 0);
            grid.lineTo(x, height);
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            grid.moveTo(0, y);
            grid.lineTo(width, y);
        }

        // Draw glow for major lines first
        grid.stroke({ 
            width: 6,
            color: 0x00FFFF,
            alpha: 0.1,
            alignment: 0.5,
            native: true
        });

        // Major grid lines with glow
        for (let x = 0; x <= width; x += gridSize * 4) {
            grid.moveTo(x, 0);
            grid.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize * 4) {
            grid.moveTo(0, y);
            grid.lineTo(width, y);
        }

        // Draw major grid lines on top
        grid.stroke({ 
            width: 2,
            color: 0x00FFFF,
            alpha: 0.4,
            alignment: 0.5,
            native: true
        });

        // Major grid lines
        for (let x = 0; x <= width; x += gridSize * 4) {
            grid.moveTo(x, 0);
            grid.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize * 4) {
            grid.moveTo(0, y);
            grid.lineTo(width, y);
        }

        this.app.stage.addChild(grid);
    }

    private handleGameOver(winner: 'player1' | 'player2' | 'draw'): void {
        this.app.ticker.remove(this.gameLoop);
        
        gameState.set({
            ...get(gameState),
            isPlaying: false,
            gameOver: true,
            winner
        });
    }

    private handleSwipe(direction: 'up' | 'down' | 'left' | 'right') {
        const currentSettings = get(settings);
        
        // Map swipe directions to player movements
        if (this.player1) {
            switch (direction) {
                case 'up':
                    this.player1.setDirection(Direction.UP);
                    break;
                case 'right':
                    this.player1.setDirection(Direction.RIGHT);
                    break;
                case 'down':
                    this.player1.setDirection(Direction.DOWN);
                    break;
                case 'left':
                    this.player1.setDirection(Direction.LEFT);
                    break;
            }
        }
    }
} 