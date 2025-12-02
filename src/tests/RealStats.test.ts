import { describe, it, expect } from 'vitest';
import axios from 'axios';

describe('REAL Stats API Access', () => {
    
    it('should allow access to stats with a valid token', async () => {
        const authUrl = import.meta.env.VITE_API_AUTH_URL;
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        const statsUrl = apiBase.replace('/wp/v2', '/farm/v1/stats/summary');

        // 1. Get a Real Token first
        const loginRes = await axios.post(`${authUrl}/token`, {
            username: 'farmer', // Ensure this user exists
            password: 'password'
        });

        const token = loginRes.data.token;
        expect(token).toBeDefined();

        // 2. Use Token to fetch Stats
        try {
            const statsRes = await axios.get(statsUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(statsRes.status).toBe(200);
            expect(statsRes.data).toHaveProperty('total_animals');
            console.log("Stats API Working. Data:", statsRes.data);

        } catch (error: any) {
            console.error("Stats Fetch Failed:", error.response?.status, error.response?.data);
            throw new Error(`Stats API failed with ${error.response?.status}`);
        }
    });
});