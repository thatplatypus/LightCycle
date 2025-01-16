export class TouchController {
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private minSwipeDistance: number = 30; // Minimum distance for a swipe
    private onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void;

    constructor(element: HTMLElement, onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void) {
        this.onSwipe = onSwipe;

        element.addEventListener('touchstart', this.handleTouchStart.bind(this));
        element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    }

    private handleTouchStart(event: TouchEvent) {
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    private handleTouchMove(event: TouchEvent) {
        if (!this.touchStartX || !this.touchStartY) return;

        event.preventDefault(); // Prevent scrolling while swiping

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        // Check if swipe distance is significant enough
        if (Math.abs(deltaX) < this.minSwipeDistance && Math.abs(deltaY) < this.minSwipeDistance) {
            return;
        }

        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            this.onSwipe(deltaX > 0 ? 'right' : 'left');
        } else {
            // Vertical swipe
            this.onSwipe(deltaY > 0 ? 'down' : 'up');
        }

        // Reset start position
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    destroy() {
        const element = document.body;
        element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    }
} 