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
    private decisionInterval: number = 30; // Make decisions every 30ms (very fast)
    private lastDecision: Direction | null = null;
    private opponentPosition: { x: number; y: number } = { x: 0, y: 0 };
    private opponentTrail: Array<{ x: number; y: number }> = [];
    private gameBounds: { width: number; height: number } = { width: 0, height: 0 };

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
        
        // Make AI decisions at regular intervals
        if (this.decisionTimer >= this.decisionInterval) {
            this.makeDecision();
            this.decisionTimer = 0;
        }

        // Call parent update method
        return super.update(delta);
    }

    private makeDecision(): void {
        const currentState = this.getCurrentGameState();
        const currentPos = this.getPosition();
        
        // EMERGENCY CHECK: If we're too close to walls, force a turn
        const wallDistance = this.getDistanceToWall(currentPos, currentState.bounds);
        if (wallDistance < 80) {
            console.log(`EMERGENCY: Too close to wall (${wallDistance}), forcing turn!`);
            const bestDirection = this.calculateBestDirection(currentState);
            if (bestDirection !== this.direction) {
                this.setDirection(bestDirection);
                this.lastDecision = bestDirection;
                console.log('AI EMERGENCY changed direction to:', bestDirection);
                return;
            }
        }
        
        // Calculate best direction using simple algorithm
        const bestDirection = this.calculateBestDirection(currentState);
        
        // Debug logging
        console.log('AI Decision:', {
            currentPos: this.getPosition(),
            currentDir: this.direction,
            bestDirection,
            wallDistance: this.getDistanceToWall(this.getPosition(), currentState.bounds),
            ownTrailLength: this.getTrailPoints().length
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
        
        // Evaluate each direction with simple scoring
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
        
        // Simple scoring system
        let score = 0;
        
        // 1. Check for immediate wall collision - NEVER ALLOW THIS
        if (futurePos.x < 0 || futurePos.x >= state.bounds.width || 
            futurePos.y < 0 || futurePos.y >= state.bounds.height) {
            console.log(`Direction ${direction} hits wall at`, futurePos);
            return -10000; // Much worse score for wall collision
        }
        
        // 2. Check for immediate trail collision
        if (this.checkCollisionWithPoint(futurePos)) {
            console.log(`Direction ${direction} hits trail at`, futurePos);
            return -10000; // Much worse score for trail collision
        }
        
        // 3. Look ahead 5 steps for future collisions - MORE AGGRESSIVE
        let futureCollision = false;
        for (let step = 1; step <= 5; step++) {
            const testPos = this.getFuturePosition(currentPos, direction, step);
            if (testPos.x < 0 || testPos.x >= state.bounds.width || 
                testPos.y < 0 || testPos.y >= state.bounds.height ||
                this.checkCollisionWithPoint(testPos)) {
                futureCollision = true;
                console.log(`Direction ${direction} will collide at step ${step}`);
                break;
            }
        }
        
        if (futureCollision) {
            return -2000; // Much heavier penalty for future collision
        }
        
        // 4. Distance to walls - MUCH MORE AGGRESSIVE
        const wallDistance = Math.min(
            futurePos.x,
            state.bounds.width - futurePos.x,
            futurePos.y,
            state.bounds.height - futurePos.y
        );
        
        // If we're getting close to walls, heavily penalize
        if (wallDistance < 100) {
            score -= (100 - wallDistance) * 50; // Much heavier penalty
            console.log(`Direction ${direction} too close to wall: ${wallDistance}`);
        } else if (wallDistance < 150) {
            score -= (150 - wallDistance) * 10; // Moderate penalty
        } else {
            score += wallDistance * 0.1; // Small bonus for staying away
        }
        
        // 5. Distance to own trail
        const ownTrailDistance = this.getDistanceToTrail(futurePos, state.player2Trail);
        if (ownTrailDistance < 50) {
            score -= (50 - ownTrailDistance) * 30; // Heavy penalty
        } else {
            score += ownTrailDistance * 0.5; // Bonus
        }
        
        // 6. Distance to opponent trail
        const opponentTrailDistance = this.getDistanceToTrail(futurePos, state.player1Trail);
        if (opponentTrailDistance < 50) {
            score -= (50 - opponentTrailDistance) * 20; // Heavy penalty
        } else {
            score += opponentTrailDistance * 0.3; // Small bonus
        }
        
        // 7. Prefer center of screen - MORE IMPORTANT
        const centerX = state.bounds.width / 2;
        const centerY = state.bounds.height / 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow(futurePos.x - centerX, 2) + Math.pow(futurePos.y - centerY, 2)
        );
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
        score += (maxDistance - distanceFromCenter) * 0.5; // Increased importance
        
        // 8. Add small randomness
        score += (Math.random() - 0.5) * 2; // Reduced randomness
        
        console.log(`Direction ${direction} score: ${score.toFixed(2)}`);
        return score;
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
                this.decisionInterval = 100; // Slower decisions
                break;
            case 'medium':
                this.decisionInterval = 50;
                break;
            case 'hard':
                this.decisionInterval = 30; // Faster decisions
                break;
        }
    }
}
