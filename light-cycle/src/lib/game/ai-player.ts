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

interface PathNode {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic cost to goal
    f: number; // Total cost
    parent?: PathNode;
}

export class AIPlayer extends Player {
    private decisionTimer: number = 0;
    private decisionInterval: number = 30; // Make decisions every 30ms (very fast)
    private lastDecision: Direction | null = null;
    private safetyMargin: number = 50; // Minimum distance to maintain from walls/trails
    private aggressionLevel: number = 0.6; // 0 = very defensive, 1 = very aggressive
    private lookAheadDistance: number = 200; // How far ahead to look for obstacles
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
        
        // Calculate best direction using improved algorithm
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
        
        // Evaluate each direction with improved scoring
        const directionScores = possibleDirections.map(dir => ({
            direction: dir,
            score: this.evaluateDirectionAdvanced(dir, state)
        }));
        
        // Debug logging
        console.log('Direction scores:', directionScores.map(d => ({
            direction: d.direction,
            score: d.score.toFixed(2)
        })));
        
        // Sort by score (higher is better)
        directionScores.sort((a, b) => b.score - a.score);
        
        // Choose best direction with some randomness for unpredictability
        const topDirections = directionScores.slice(0, 2);
        const randomIndex = Math.random() < 0.95 ? 0 : 1; // 95% chance to pick best
        
        return topDirections[randomIndex]?.direction || currentDir;
    }

    private getPossibleDirections(currentDir: Direction): Direction[] {
        const allDirections = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
        return allDirections.filter(dir => {
            // Exclude 180-degree turns
            const isOpposite = Math.abs(dir - currentDir) === 2;
            return !isOpposite;
        });
    }

    private evaluateDirectionAdvanced(direction: Direction, state: GameState): number {
        const currentPos = this.getPosition();
        let score = 0;
        
        // Check immediate collision
        const immediatePos = this.getFuturePosition(currentPos, direction);
        if (this.wouldCollideImmediate(immediatePos, state)) {
            console.log(`Direction ${direction} would collide immediately at`, immediatePos);
            return -10000; // Immediate collision = very bad
        }
        
        // Look ahead 5 steps to see if we'll hit something
        let stepsToCollision = 0;
        for (let step = 1; step <= 5; step++) {
            const testPos = this.getFuturePosition(currentPos, direction, step);
            if (this.wouldCollideImmediate(testPos, state)) {
                stepsToCollision = step;
                break;
            }
        }
        
        // If we'll collide soon, heavily penalize this direction
        if (stepsToCollision > 0) {
            score -= (6 - stepsToCollision) * 1000; // Closer collision = worse score
        } else {
            // No collision in next 5 steps, give bonus
            score += 1000;
        }
        
        // Distance to walls
        const wallDistance = this.getDistanceToWall(immediatePos, state.bounds);
        if (wallDistance < 50) {
            score -= (50 - wallDistance) * 20; // Heavy penalty for getting close to walls
        } else {
            score += wallDistance * 0.1; // Small bonus for staying away
        }
        
        // Distance to own trail
        const ownTrailDistance = this.getDistanceToTrail(immediatePos, state.player2Trail);
        if (ownTrailDistance < 30) {
            score -= (30 - ownTrailDistance) * 50; // Very heavy penalty
        } else {
            score += ownTrailDistance * 0.5; // Good bonus
        }
        
        // Distance to opponent trail
        const opponentTrailDistance = this.getDistanceToTrail(immediatePos, state.player1Trail);
        if (opponentTrailDistance < 30) {
            score -= (30 - opponentTrailDistance) * 30; // Heavy penalty
        } else {
            score += opponentTrailDistance * 0.3; // Moderate bonus
        }
        
        // Prefer center of screen
        const centerDistance = this.getDistanceToCenter(immediatePos, state.bounds);
        const maxCenterDistance = Math.min(state.bounds.width, state.bounds.height) / 2;
        const centerScore = (maxCenterDistance - centerDistance) / maxCenterDistance;
        score += centerScore * 10;
        
        // Calculate available space in this direction
        const spaceScore = this.calculateSpaceScore(immediatePos, state);
        score += spaceScore * 2;
        
        // Add small amount of randomness
        score += (Math.random() - 0.5) * 10;
        
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
            for (let step = 1; step < 50; step++) {
                testPos = this.getFuturePosition(testPos, dir);
                if (this.wouldCollideImmediate(testPos, state)) {
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

    private wouldCollideImmediate(pos: { x: number; y: number }, state: GameState): boolean {
        // Check wall collision
        if (pos.x < 0 || pos.x >= state.bounds.width || 
            pos.y < 0 || pos.y >= state.bounds.height) {
            console.log(`Wall collision at`, pos, `bounds:`, state.bounds);
            return true;
        }
        
        // Check trail collision with tighter tolerance
        const trailCollision = this.checkCollisionWithPoint(pos);
        if (trailCollision) {
            console.log(`Trail collision at`, pos);
        }
        return trailCollision;
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

    private getDistanceToTrail(pos: { x: number; y: number }, trail: Array<{ x: number; y: number }>): number {
        if (trail.length === 0) return 1000; // Large distance if no trail
        
        let minDistance = Infinity;
        for (const point of trail) {
            const distance = this.getDistanceToPoint(pos, point);
            minDistance = Math.min(minDistance, distance);
        }
        return minDistance;
    }

    private getDistanceToCenter(pos: { x: number; y: number }, bounds: { width: number; height: number }): number {
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        return this.getDistanceToPoint(pos, { x: centerX, y: centerY });
    }

    private getDistanceToPoint(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
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
                this.decisionInterval = 150; // Slower decisions
                this.aggressionLevel = 0.3;
                this.safetyMargin = 60;
                this.lookAheadDistance = 150;
                break;
            case 'medium':
                this.decisionInterval = 80;
                this.aggressionLevel = 0.6;
                this.safetyMargin = 30;
                this.lookAheadDistance = 200;
                break;
            case 'hard':
                this.decisionInterval = 40; // Faster decisions
                this.aggressionLevel = 0.8;
                this.safetyMargin = 20;
                this.lookAheadDistance = 300;
                break;
        }
    }
}

