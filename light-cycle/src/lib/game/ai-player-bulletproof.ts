import { Player, Direction } from './player';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/game-state';
import { settings } from '$lib/stores/settings';

interface GameState {
    player1Position: { x: number; y: number };
    player1Trail: Array<{ x: number; y: number }>;
    player2Position: { x: number; y: number };
    player2Trail: Array<{ x: number; y: number }>;
    bounds: { width: number; height: number };
}

export class AIPlayer extends Player {
    private decisionTimer: number = 0;
    private decisionInterval: number = 5; // Make decisions every 5ms (ULTRA FAST)
    private lastDecision: Direction | null = null;
    private opponentPosition: { x: number; y: number } = { x: 0, y: 0 };
    private opponentTrail: Array<{ x: number; y: number }> = [];
    private gameBounds: { width: number; height: number } = { width: 0, height: 0 };
    private panicMode: boolean = false;
    private lastWallDistance: number = 1000;
    private forcedDirection: Direction | null = null;

    constructor(
        x: number,
        y: number,
        speed: number,
        initialDirection: Direction = Direction.LEFT,
        initialColor: string,
        playerNumber: number
    ) {
        super(x, y, speed, initialDirection, initialColor, playerNumber);
        this.gameBounds = { width: window.innerWidth, height: window.innerHeight };
    }

    public update(delta: number): boolean {
        // Update decision timer
        this.decisionTimer += delta;
        
        // CONSTANT PANIC CHECK - Check every frame for wall proximity
        this.panicCheck();
        
        // Make AI decisions at regular intervals
        if (this.decisionTimer >= this.decisionInterval) {
            this.makeDecision();
            this.decisionTimer = 0;
        }

        // OVERRIDE PARENT UPDATE - Use our own movement logic
        return this.aiUpdate(delta);
    }

    private aiUpdate(delta: number): boolean {
        const oldPosition = { ...this.position };
        const gameStateValue = get(gameState);
        const settingsStore = get(settings);

        // SAFETY CHECK: Before moving, ensure we won't hit walls
        const currentPos = this.position;
        const wallDistance = this.getDistanceToWall(currentPos, this.gameBounds);
        
        // If we're too close to walls, force a safe direction
        if (wallDistance < 150) {
            console.log(`🚨 SAFETY OVERRIDE: Wall distance ${wallDistance}px - forcing safe direction`);
            this.forceSafeDirection();
        }

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

        // SAFETY CHECK: After moving, check if we hit a wall
        const newWallDistance = this.getDistanceToWall(this.position, this.gameBounds);
        if (newWallDistance <= 0) {
            console.log(`❌ COLLISION PREVENTED: Would hit wall at ${this.position.x}, ${this.position.y}`);
            // Revert position and force a turn
            this.position = oldPosition;
            this.forceSafeDirection();
            return false; // Don't continue with collision
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
            
            // Update last position for next frame
            this.lastPosition = { ...this.position };
        }

        return true;
    }

    private forceSafeDirection(): void {
        const currentPos = this.position;
        const currentDir = this.direction;
        
        // Get all possible directions (excluding 180-degree turns)
        const possibleDirections = this.getPossibleDirections(currentDir);
        
        // Find the direction that takes us furthest from walls
        let bestDirection = currentDir;
        let maxWallDistance = 0;
        
        for (const dir of possibleDirections) {
            const futurePos = this.getFuturePosition(currentPos, dir);
            const futureWallDistance = this.getDistanceToWall(futurePos, this.gameBounds);
            
            if (futureWallDistance > maxWallDistance) {
                maxWallDistance = futureWallDistance;
                bestDirection = dir;
            }
        }
        
        console.log(`🔥 FORCED SAFE DIRECTION: ${currentDir} -> ${bestDirection} (wall distance: ${maxWallDistance}px)`);
        this.setDirection(bestDirection);
        this.lastDecision = bestDirection;
        this.forcedDirection = bestDirection;
    }

    private panicCheck(): void {
        const currentPos = this.getPosition();
        const wallDistance = this.getDistanceToWall(currentPos, this.gameBounds);
        
        // PANIC MODE: If we're getting close to walls, force immediate action
        if (wallDistance < 200) {
            this.panicMode = true;
            console.log(`🚨 PANIC MODE ACTIVATED! Wall distance: ${wallDistance}px`);
            
            // Force immediate turn if we're too close
            if (wallDistance < 100) {
                console.log(`🔥 EMERGENCY TURN! Wall distance: ${wallDistance}px`);
                this.forceSafeDirection();
            }
        } else {
            this.panicMode = false;
        }
        
        this.lastWallDistance = wallDistance;
    }

    private makeDecision(): void {
        const currentState = this.getCurrentGameState();
        const currentPos = this.getPosition();
        
        // Calculate best direction
        const bestDirection = this.calculateBestDirection(currentState);
        
        // Debug logging
        console.log('AI Decision:', {
            currentPos: this.getPosition(),
            currentDir: this.direction,
            bestDirection,
            wallDistance: this.getDistanceToWall(this.getPosition(), currentState.bounds),
            panicMode: this.panicMode,
            lastWallDistance: this.lastWallDistance
        });
        
        // Apply the decision if it's different from current direction
        if (bestDirection !== this.direction && bestDirection !== this.lastDecision) {
            this.setDirection(bestDirection);
            this.lastDecision = bestDirection;
            console.log('AI changed direction to:', bestDirection);
        }
    }

    private getCurrentGameState(): GameState {
        return {
            player1Position: this.opponentPosition,
            player1Trail: this.opponentTrail,
            player2Position: this.getPosition(),
            player2Trail: this.getTrailPoints(),
            bounds: this.gameBounds
        };
    }

    private calculateBestDirection(state: GameState): Direction {
        const currentPos = this.getPosition();
        const currentDir = this.direction;
        
        // Get all possible directions (excluding 180-degree turns)
        const possibleDirections = this.getPossibleDirections(currentDir);
        
        // Evaluate each direction with ULTRA-AGGRESSIVE scoring
        const directionScores = possibleDirections.map(dir => ({
            direction: dir,
            score: this.evaluateDirection(dir, state)
        }));
        
        // Debug logging
        console.log('Direction scores:', directionScores.map(d => ({
            direction: d.direction,
            score: d.score.toFixed(2)
        })));
        
        // Sort by score (higher is better)
        directionScores.sort((a, b) => b.score - a.score);
        
        // Choose best direction
        return directionScores[0]?.direction || currentDir;
    }

    private getPossibleDirections(currentDir: Direction): Direction[] {
        const allDirections = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
        return allDirections.filter(dir => {
            // Exclude 180-degree turns
            const isOpposite = Math.abs(dir - currentDir) === 2;
            return !isOpposite;
        });
    }

    private evaluateDirection(direction: Direction, state: GameState): number {
        const currentPos = this.getPosition();
        const futurePos = this.getFuturePosition(currentPos, direction);
        
        // ULTRA-AGGRESSIVE scoring system - SURVIVAL FIRST
        let score = 0;
        
        // 1. ABSOLUTE WALL COLLISION CHECK - NEVER ALLOW THIS
        if (futurePos.x < 0 || futurePos.x >= state.bounds.width || 
            futurePos.y < 0 || futurePos.y >= state.bounds.height) {
            console.log(`❌ Direction ${direction} hits wall at`, futurePos);
            return -1000000; // ABSOLUTELY FORBIDDEN
        }
        
        // 2. ABSOLUTE TRAIL COLLISION CHECK - NEVER ALLOW THIS
        if (this.checkCollisionWithPoint(futurePos)) {
            console.log(`❌ Direction ${direction} hits trail at`, futurePos);
            return -1000000; // ABSOLUTELY FORBIDDEN
        }
        
        // 3. ULTRA-AGGRESSIVE FUTURE COLLISION CHECK - Look ahead 15 steps
        let futureCollision = false;
        let stepsToCollision = 0;
        for (let step = 1; step <= 15; step++) {
            const testPos = this.getFuturePosition(currentPos, direction, step);
            if (testPos.x < 0 || testPos.x >= state.bounds.width || 
                testPos.y < 0 || testPos.y >= state.bounds.height ||
                this.checkCollisionWithPoint(testPos)) {
                futureCollision = true;
                stepsToCollision = step;
                console.log(`⚠️ Direction ${direction} will collide at step ${step}`);
                break;
            }
        }
        
        if (futureCollision) {
            // The closer the collision, the worse the score
            return -100000 - (15 - stepsToCollision) * 10000;
        }
        
        // 4. ULTRA-AGGRESSIVE WALL DISTANCE CHECK
        const wallDistance = Math.min(
            futurePos.x,
            state.bounds.width - futurePos.x,
            futurePos.y,
            state.bounds.height - futurePos.y
        );
        
        // In panic mode, be EXTREMELY aggressive about wall distance
        if (this.panicMode) {
            if (wallDistance < 400) {
                score -= (400 - wallDistance) * 500; // EXTREME penalty
                console.log(`🚨 PANIC: Direction ${direction} too close to wall: ${wallDistance}`);
            }
        } else {
            if (wallDistance < 300) {
                score -= (300 - wallDistance) * 200; // Heavy penalty
                console.log(`⚠️ Direction ${direction} too close to wall: ${wallDistance}`);
            } else if (wallDistance < 500) {
                score -= (500 - wallDistance) * 50; // Moderate penalty
            }
        }
        
        // 5. TRAIL DISTANCE CHECK - Much more aggressive
        const ownTrailDistance = this.getDistanceToTrail(futurePos, state.player2Trail);
        if (ownTrailDistance < 150) {
            score -= (150 - ownTrailDistance) * 200; // Heavy penalty
        } else if (ownTrailDistance < 300) {
            score -= (300 - ownTrailDistance) * 50; // Moderate penalty
        } else {
            score += ownTrailDistance * 0.1; // Small bonus
        }
        
        // 6. OPPONENT TRAIL DISTANCE CHECK
        const opponentTrailDistance = this.getDistanceToTrail(futurePos, state.player1Trail);
        if (opponentTrailDistance < 150) {
            score -= (150 - opponentTrailDistance) * 100; // Heavy penalty
        } else if (opponentTrailDistance < 300) {
            score -= (300 - opponentTrailDistance) * 20; // Moderate penalty
        } else {
            score += opponentTrailDistance * 0.05; // Small bonus
        }
        
        // 7. CENTER PREFERENCE - Much stronger
        const centerX = state.bounds.width / 2;
        const centerY = state.bounds.height / 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow(futurePos.x - centerX, 2) + Math.pow(futurePos.y - centerY, 2)
        );
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
        score += (maxDistance - distanceFromCenter) * 10; // Strong center preference
        
        // 8. SPACE CALCULATION - Prefer directions with more open space
        const spaceScore = this.calculateSpaceScore(futurePos, state);
        score += spaceScore * 20; // Strong space preference
        
        // 9. AGGRESSION - Try to get closer to opponent when safe
        if (state.player1Position.x !== 0 || state.player1Position.y !== 0) {
            const opponentDistance = this.getDistanceToPoint(futurePos, state.player1Position);
            const currentOpponentDistance = this.getDistanceToPoint(currentPos, state.player1Position);
            
            // Only be aggressive if we're safe
            if (wallDistance > 400 && ownTrailDistance > 300) {
                if (opponentDistance < currentOpponentDistance) {
                    score += 100; // Bonus for getting closer
                } else {
                    score -= 50; // Small penalty for moving away
                }
            }
        }
        
        // 10. Minimal randomness
        score += (Math.random() - 0.5) * 1;
        
        console.log(`Direction ${direction} score: ${score.toFixed(2)}`);
        return score;
    }

    private calculateSpaceScore(pos: { x: number; y: number }, state: GameState): number {
        // Calculate how much open space is available in each direction from this position
        const directions = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
        let totalSpace = 0;
        
        for (const dir of directions) {
            let spaceInDirection = 0;
            let testPos = { ...pos };
            
            // Count how many steps we can move in this direction before hitting something
            for (let step = 1; step < 300; step++) {
                testPos = this.getFuturePosition(testPos, dir);
                if (testPos.x < 0 || testPos.x >= state.bounds.width || 
                    testPos.y < 0 || testPos.y >= state.bounds.height ||
                    this.checkCollisionWithPoint(testPos)) {
                    break;
                }
                spaceInDirection++;
            }
            
            totalSpace += spaceInDirection;
        }
        
        return totalSpace;
    }

    private getFuturePosition(currentPos: { x: number; y: number }, direction: Direction, steps: number = 1): { x: number; y: number } {
        const speed = this.speed * steps;
        
        switch (direction) {
            case Direction.UP:
                return { x: currentPos.x, y: currentPos.y - speed };
            case Direction.RIGHT:
                return { x: currentPos.x + speed, y: currentPos.y };
            case Direction.DOWN:
                return { x: currentPos.x, y: currentPos.y + speed };
            case Direction.LEFT:
                return { x: currentPos.x - speed, y: currentPos.y };
            default:
                return currentPos;
        }
    }

    private getDistanceToTrail(pos: { x: number; y: number }, trail: Array<{ x: number; y: number }>): number {
        if (trail.length === 0) return 1000; // Large distance if no trail
        
        let minDistance = Infinity;
        for (const point of trail) {
            const distance = this.getDistanceToPoint(pos, point);
            minDistance = Math.min(minDistance, distance);
        }
        return minDistance;
    }

    private getDistanceToPoint(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getDistanceToWall(pos: { x: number; y: number }, bounds: { width: number; height: number }): number {
        const distances = [
            pos.x, // Distance to left wall
            bounds.width - pos.x, // Distance to right wall
            pos.y, // Distance to top wall
            bounds.height - pos.y // Distance to bottom wall
        ];
        return Math.min(...distances);
    }

    // Method to update AI with opponent information
    public updateOpponentInfo(opponentPosition: { x: number; y: number }, opponentTrail: Array<{ x: number; y: number }>): void {
        this.opponentPosition = opponentPosition;
        this.opponentTrail = opponentTrail;
    }

    // Method to update game bounds
    public updateGameBounds(bounds: { width: number; height: number }): void {
        this.gameBounds = bounds;
    }

    // Method to adjust AI difficulty
    public setDifficulty(level: 'easy' | 'medium' | 'hard'): void {
        switch (level) {
            case 'easy':
                this.decisionInterval = 20; // Slower decisions
                break;
            case 'medium':
                this.decisionInterval = 10;
                break;
            case 'hard':
                this.decisionInterval = 5; // Ultra fast decisions
                break;
        }
    }
}
