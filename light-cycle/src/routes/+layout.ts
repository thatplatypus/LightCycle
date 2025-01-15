import { audioManager } from '$lib/audio/manager';

export const load = async () => {
    // Temporarily disable audio loading until we have files
    // await audioManager.init();
    return {};
}; 

export const ssr = false;
export const csr = true;