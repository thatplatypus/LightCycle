import { GlowFilter } from '@pixi/filter-glow';
import * as PIXI from 'pixi.js';
import type { Filter } from 'pixi.js';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/game-state';
import { settings } from '$lib/stores/settings';

export enum Direction {
    UP,
    RIGHT,
    DOWN,
    LEFT
}

interface Particle {
    sprite: PIXI.Graphics;
    life: number;
    maxLife: number;
    velocity: {
        x: number;
        y: number;
    };
}

export class Player {
    private sprite: PIXI.Graphics;
    private trail: PIXI.Graphics;
    private particleContainer: PIXI.Container;
    private particles: Particle[] = [];
    private position: { x: number; y: number };
    private direction: Direction;
    private speed: number;
    private color: number;
    private trailPoints: Array<{ x: number; y: number }>;
    private lastPosition: { x: number; y: number };
    private distanceTraveled: number = 0;
    private unsubscribe: () => void;

    constructor(
        x: number, 
        y: number,
        speed: number,
        initialDirection: Direction = Direction.RIGHT,
        initialColor: string,
        playerNumber: number
    ) {
        const settingsStore = get(settings);
        this.speed = speed;
        this.color = parseInt(initialColor.replace('#', ''), 16);
        
        console.log(`Player ${playerNumber} initialized:`, {
            initialSpeed: speed,
            initialColor,
            parsedColor: this.color
        });

        this.position = { x, y };
        this.lastPosition = { x, y };
        this.distanceTraveled = 0;
        this.direction = initialDirection;
        this.trailPoints = [{x, y}];

        // Initialize containers first
        this.sprite = new PIXI.Graphics();
        this.trail = new PIXI.Graphics();
        this.particleContainer = new PIXI.Container();
        
        // Ensure visibility and position
        this.particleContainer.position.set(0, 0);
        this.particleContainer.visible = true;
        
        // Initial graphics setup
        this.initializeGraphics();

        // Add debug logging for scoring
        console.log(`Player ${playerNumber} scoring initialized:`, {
            position: this.position,
            lastPosition: this.lastPosition,
            distanceTraveled: this.distanceTraveled
        });

        // Subscribe to settings changes AFTER initialization
        this.unsubscribe = settings.subscribe(newSettings => {
            console.log(`Player ${playerNumber} settings changed:`, {
                newSpeed: newSettings.playerSpeed,
                currentSpeed: this.speed,
                newColor: playerNumber === 1 ? newSettings.player1Color : newSettings.player2Color,
                currentColor: this.color.toString(16)
            });

            this.speed = newSettings.playerSpeed;
            // Update color based on player number
            this.color = parseInt(
                (playerNumber === 1 ? newSettings.player1Color : newSettings.player2Color)
                .replace('#', ''), 
                16
            );
            this.initializeGraphics();
        });
    }

    private createParticle(): void {
        const particle = new PIXI.Graphics();
        
        // Much larger particles
        particle
            .fill({ color: this.color })
            .circle(0, 0, 12)                   // Very large outer circle
            .fill({ color: this.color, alpha: 0.5 })
            .circle(0, 0, 8)                    // Medium circle
            .fill({ color: 0xFFFFFF })
            .circle(0, 0, 4);                   // Bright white center
        
        particle.position.set(this.position.x, this.position.y);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;  // Slower for better visibility
        const maxLife = 1;  // Longer life
        
        this.particles.push({
            sprite: particle,
            life: maxLife,
            maxLife,
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }
        });

        if (this.particleContainer.parent) {
            this.particleContainer.parent.addChild(particle);
        }
    }

    private updateParticles(delta: number): void {
        // Create particles more frequently
        if (Math.random() < 0.2) {  // 20% chance each frame
            this.createParticle();
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= delta * 0.016;

            if (particle.life <= 0) {
                if (particle.sprite.parent) {
                    particle.sprite.parent.removeChild(particle.sprite);
                }
                this.particles.splice(i, 1);
            } else {
                const lifeRatio = particle.life / particle.maxLife;
                particle.sprite.alpha = lifeRatio * 0.6;  // Fade out smoothly
                particle.sprite.position.x += particle.velocity.x;
                particle.sprite.position.y += particle.velocity.y;
            }
        }
    }

    private initializeGraphics(): void {
        // Clear existing graphics
        this.sprite.clear();
        this.trail.clear();

        // Create bike shape
        this.sprite
            .fill({ color: this.color, alpha: 0.9 })
            .stroke({ color: 0xFFFFFF, width: 2 })
            .moveTo(-15, -8)
            .lineTo(15, -4)
            .lineTo(15, 4)
            .lineTo(-15, 8)
            .lineTo(-12, 0)
            .lineTo(-15, -8)
            .closePath();

        // Add detail lines
        this.sprite
            .stroke({ color: 0xFFFFFF, width: 1.5, alpha: 0.9 })
            .moveTo(-12, 0)
            .lineTo(10, 0)
            .moveTo(-8, -6)
            .lineTo(8, -3)
            .moveTo(-8, 6)
            .lineTo(8, 3);

        // Update glow effects
        this.sprite.filters = [
            new GlowFilter({
                distance: 20,
                outerStrength: 15,
                innerStrength: 8,
                color: this.color,
                quality: 1,
                knockout: false
            }) as any,
            new GlowFilter({
                distance: 10,
                outerStrength: 6,
                innerStrength: 3,
                color: 0xFFFFFF,
                quality: 1,
                knockout: false
            }) as any
        ];

        // Update rotation
        this.updateRotation();

        // Update trail (don't recreate it)
        this.updateTrail();
    }

    // Add new method to handle rotation
    private updateRotation(): void {
        switch (this.direction) {
            case Direction.UP:
                this.sprite.rotation = -Math.PI / 2;
                break;
            case Direction.RIGHT:
                this.sprite.rotation = 0;
                break;
            case Direction.DOWN:
                this.sprite.rotation = Math.PI / 2;
                break;
            case Direction.LEFT:
                this.sprite.rotation = Math.PI;
                break;
        }
    }

    private updateTrail(): void {
        this.trail.clear();
        
        if (this.trailPoints.length > 1) {
            // Draw colored base trail
            this.trail
                .stroke({ 
                    color: this.color,
                    width: 12,
                    alpha: 0.8,
                    alignment: 0.5,
                    join: 'round',
                    cap: 'round'
                })
                .moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
            
            for (const point of this.trailPoints) {
                this.trail.lineTo(point.x, point.y);
            }

            // Draw outer glow
            this.trail
                .stroke({ 
                    color: this.color,
                    width: 16,
                    alpha: 0.4,
                    alignment: 0.5,
                    join: 'round',
                    cap: 'round'
                })
                .moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
            
            for (const point of this.trailPoints) {
                this.trail.lineTo(point.x, point.y);
            }

            // Draw bright core
            this.trail
                .stroke({ 
                    color: 0xFFFFFF,
                    width: 2,
                    alpha: 0.8,
                    alignment: 0.5,
                    join: 'round',
                    cap: 'round'
                })
                .moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
            
            for (const point of this.trailPoints) {
                this.trail.lineTo(point.x, point.y);
            }
        }
    }

    public update(delta: number): boolean {
        const oldPosition = { ...this.position };
        const gameStateValue = get(gameState);
        const settingsStore = get(settings);

        // Debug game mode
        console.log('Game mode check:', {
            gameMode: settingsStore.gameMode,
            opponent: gameStateValue.opponent,
            isSinglePlayer: settingsStore.gameMode === 'single' && !gameStateValue.opponent
        });

        // Update position based on direction
        switch (this.direction) {
            case Direction.UP:
                this.position.y -= this.speed;
                break;
            case Direction.RIGHT:
                this.position.x += this.speed;
                break;
            case Direction.DOWN:
                this.position.y += this.speed;
                break;
            case Direction.LEFT:
                this.position.x -= this.speed;
                break;
        }

        // Only add trail point if we've actually moved
        const dx2 = this.position.x - oldPosition.x;
        const dy2 = this.position.y - oldPosition.y;
        if (Math.abs(dx2) > 0 || Math.abs(dy2) > 0) {
            this.trailPoints.push({...this.position});
        }

        // Update sprite position and effects
        this.sprite.position.set(this.position.x, this.position.y);
        this.updateTrail();
        this.updateParticles(delta);

        // Update score in single player mode
        if (settingsStore.gameMode === 'single' && !gameStateValue.opponent) {
            // Calculate distance traveled
            const dx = this.position.x - this.lastPosition.x;
            const dy = this.position.y - this.lastPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.distanceTraveled += distance;
            
            // Debug log scoring updates
            console.log('Score update:', {
                distance,
                totalDistance: this.distanceTraveled,
                currentScore: gameStateValue.score,
                shouldUpdate: Math.floor(this.distanceTraveled / 50) > Math.floor((this.distanceTraveled - distance) / 50)
            });
            
            // Update score every 50 pixels traveled
            if (Math.floor(this.distanceTraveled / 50) > Math.floor((this.distanceTraveled - distance) / 50)) {
                gameState.update(state => ({
                    ...state,
                    score: state.score + 5
                }));
            }
        }

        // Update last position for next frame
        this.lastPosition = { ...this.position };
        
        // Check for collisions
        return this.checkCollisionWithPoint(this.position);
    }

    public setDirection(direction: Direction): void {
        // Prevent 180-degree turns
        const isOpposite = Math.abs(this.direction - direction) === 2;
        if (!isOpposite) {
            this.direction = direction;
            this.updateRotation();
        }
    }

    public getSprite(): PIXI.Graphics {
        return this.sprite;
    }

    public getTrail(): PIXI.Graphics {
        return this.trail;
    }

    public getPosition(): { x: number; y: number } {
        return {...this.position};
    }

    public getTrailPoints(): Array<{ x: number; y: number }> {
        return [...this.trailPoints];
    }

    public getParticleContainer(): PIXI.Container {
        return this.particleContainer;
    }

    private checkTrailCollision(): boolean {
        // Skip the most recent few points to prevent self-collision at turns
        const recentPoints = 10;
        if (this.trailPoints.length < recentPoints + 2) return false;

        const currentPos = this.position;
        const tolerance = 5; // Collision tolerance in pixels

        // Check against each trail segment
        for (let i = 0; i < this.trailPoints.length - recentPoints - 1; i++) {
            const p1 = this.trailPoints[i];
            const p2 = this.trailPoints[i + 1];

            // Line segment collision detection
            const collision = this.lineSegmentIntersection(
                currentPos,
                { x: currentPos.x + tolerance, y: currentPos.y + tolerance },
                p1,
                p2,
                tolerance
            );

            if (collision) return true;
        }

        return false;
    }

    private lineSegmentIntersection(
        pos: { x: number; y: number },
        posEnd: { x: number; y: number },
        lineStart: { x: number; y: number },
        lineEnd: { x: number; y: number },
        tolerance: number
    ): boolean {
        // Calculate distances
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return false;

        // Calculate point-to-line distance
        const t = ((pos.x - lineStart.x) * dx + (pos.y - lineStart.y) * dy) / (length * length);
        
        // Check if closest point is within line segment
        if (t < 0) return this.distanceBetweenPoints(pos, lineStart) < tolerance;
        if (t > 1) return this.distanceBetweenPoints(pos, lineEnd) < tolerance;

        // Calculate closest point on line
        const closestPoint = {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy
        };

        return this.distanceBetweenPoints(pos, closestPoint) < tolerance;
    }

    private distanceBetweenPoints(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public checkCollisionWithPoint(point: { x: number; y: number }): boolean {
        // Skip the most recent few points to prevent false collisions
        const recentPoints = 10;
        if (this.trailPoints.length < recentPoints + 2) return false;

        const tolerance = 5; // Collision tolerance in pixels

        // Check against each trail segment
        for (let i = 0; i < this.trailPoints.length - recentPoints - 1; i++) {
            const p1 = this.trailPoints[i];
            const p2 = this.trailPoints[i + 1];

            // Line segment collision detection
            const collision = this.lineSegmentIntersection(
                point,
                { x: point.x + tolerance, y: point.y + tolerance },
                p1,
                p2,
                tolerance
            );

            if (collision) return true;
        }

        return false;
    }

    // Clean up subscription
    public destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
} 