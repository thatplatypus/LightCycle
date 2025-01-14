import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock PIXI.js
vi.mock('pixi.js', () => {
    const mockFn = vi.fn();
    return {
        Application: class {
            init() { return Promise.resolve(); }
            renderer = { screen: { width: 800, height: 600 } };
            stage = { addChild: mockFn };
            ticker = { 
                add: mockFn, 
                remove: mockFn 
            };
        },
        Container: class {
            addChild = mockFn;
            removeChild = mockFn;
            position = { set: mockFn };
            visible = true;
        },
        Graphics: class {
            clear = mockFn;
            position = { set: mockFn };
            fill() { return this; }
            stroke() { return this; }
            circle() { return this; }
            rect() { return this; }
            moveTo() { return this; }
            lineTo() { return this; }
            closePath() { return this; }
        }
    };
});

// Mock @pixi/filter-glow
vi.mock('@pixi/filter-glow', () => ({
    GlowFilter: class {
        constructor() {
            return {};
        }
    }
})); 

// Mock our UI components
vi.mock('$lib/components/ui/button', () => ({
    default: {
        render(node: any) {
            const button = document.createElement('button');
            button.innerHTML = node.innerHTML;
            button.onclick = node.onclick;
            return button;
        }
    }
})); 