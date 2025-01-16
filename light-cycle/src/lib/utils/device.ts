export const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        ((navigator as any).msMaxTouchPoints > 0));
}; 