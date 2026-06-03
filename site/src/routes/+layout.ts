import { API_URL } from '../stores/global.js';

export const load = async ({ fetch }) => {
    try {
        const res = await fetch(`${API_URL}/status`);
        const { message } = await res.json();
        return { statusMessage: message as StatusMessage };
    } catch {
        return { statusMessage: null };
    }
};