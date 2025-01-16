import { writable } from 'svelte/store';

const debugStore = writable<string[]>([]);

export const debug = {
    log: (...args: any[]) => {
        const msg = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        console.log(msg);
        debugStore.update(msgs => [...msgs, msg]);
    },
    error: (...args: any[]) => {
        const msg = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        console.error(msg);
        debugStore.update(msgs => [...msgs, `ERROR: ${msg}`]);
    },
    subscribe: debugStore.subscribe
}; 