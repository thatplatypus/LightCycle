const DEBUG = import.meta.env.DEV;

export const debug = {
    log: (...args: any[]) => {
        if (DEBUG) {
            console.log(...args);
        }
    },
    error: (...args: any[]) => {
        if (DEBUG) {
            console.error(...args);
        }
    }
}; 