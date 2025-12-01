import { describe, it, expect } from 'vitest';

describe('Backend Connectivity', () => {
    
    it('should receive a valid 200 OK from the WordPress API', async () => {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        // Ensure the URL is defined before trying to fetch
        expect(apiUrl).toBeDefined();

        try {
            // We use the base /wp-json/ endpoint to check general health
            // The .env usually points to /wp/v2, so we strip that to check the root
            const rootUrl = apiUrl.replace('/wp/v2', '');
            
            const response = await fetch(rootUrl);
            
            // 1. Check HTTP Status
            expect(response.status).toBe(200);

            // 2. Check content type is JSON
            const contentType = response.headers.get('content-type');
            expect(contentType).toContain('application/json');

            // 3. Check if it looks like WordPress
            const data = await response.json();
            expect(data).toHaveProperty('name'); // WP returns site name in root JSON
            expect(data).toHaveProperty('namespaces'); // Lists available APIs

        } catch (error) {
            // If fetch fails (server down), force the test to fail with a clear message
            console.error("Connection Failed:", error);
            throw new Error(`Could not connect to WordPress at ${apiUrl}. Is the server running?`);
        }
    });
});