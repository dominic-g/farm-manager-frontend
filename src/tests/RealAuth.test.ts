import { describe, it, expect } from 'vitest';
import axios from 'axios';

// We do NOT mock axios here. We want the real internet connection.

describe('REAL Backend Integration', () => {

    it('should actually authenticate with the local WordPress', async () => {
        // 1. Get URL from .env
        const authUrl = import.meta.env.VITE_API_AUTH_URL;
        if (!authUrl) {
            throw new Error("VITE_API_AUTH_URL is not defined in .env");
        }

        console.log(`Attempting connection to: ${authUrl}/token`);

        try {
            // 2. Attempt Real Login
            // CHANGE THESE CREDENTIALS to match a real user in your local WordPress
            const payload = {
                username: 'farmer', 
                password: 'password' 
            };

            const response = await axios.post(`${authUrl}/token`, payload);

            // 3. Verify Real Data
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('user_email');
            
            console.log("Success! Token received:", response.data.token.substring(0, 10) + "...");

        } catch (error: any) {
            // Better error logging to help debug why it failed
            if (error.response) {
                console.error("Server Error:", error.response.status, error.response.data);
                throw new Error(`Server refused login: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.error("Network Error:", error.message);
                throw new Error(`Could not reach server at ${authUrl}. Is WordPress running?`);
            } else {
                throw error;
            }
        }
    });
});