import { describe, it, expect } from 'vitest';
import axios from 'axios';

// REAL Integration Test - Hits localhost/wordpress
describe('REAL Registration Flow', () => {
    
    it('should register a new user successfully', async () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        const rootUrl = apiBase.replace('/wp/v2', ''); // Get root
        const registerUrl = `${rootUrl}/farm/v1/register`;

        // Generate a random user so we don't get "User already exists" errors
        const rand = Math.floor(Math.random() * 10000);
        const newUser = {
            username: `TestFarmer_${rand}`,
            email: `farmer${rand}@test.com`,
            password: 'password123'
        };

        console.log(`Attempting to register: ${newUser.username} at ${registerUrl}`);

        try {
            const response = await axios.post(registerUrl, newUser);
            
            // Assertions based on your requirements
            expect(response.status).toBe(201);
            expect(response.data.message).toContain('Registration successful');
            
            console.log("Registration Passed:", response.data);
        } catch (error: any) {
            console.error("Registration Failed:", error.response?.data || error.message);
            throw error;
        }
    });
});