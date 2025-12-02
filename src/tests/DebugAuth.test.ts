import { describe, it, expect } from 'vitest';
import axios from 'axios';

describe('DEBUG Auth Headers', () => {
    it('checks if server is stripping headers', async () => {
        const authUrl = import.meta.env.VITE_API_AUTH_URL;
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        const debugUrl = apiBase.replace('/wp/v2', '/farm/v1/debug-auth');

        // Login
        const loginRes = await axios.post(`${authUrl}/token`, {
            username: 'farmer', 
            password: 'password'
        });
        const token = loginRes.data.token;

        // Call Debug Endpoint
        const res = await axios.get(debugUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("SERVER DEBUG INFO:", res.data);
    });
});