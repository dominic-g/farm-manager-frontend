// @vitest-environment node
import { describe, it, expect } from 'vitest';
import axios from 'axios';

describe('REAL Slug & Navigation Integration', () => {

    // Helper to get headers
    const getHeaders = async () => {
        const authUrl = import.meta.env.VITE_API_AUTH_URL;
        // Ensure you have a valid user 'farmer' / 'password'
        const res = await axios.post(`${authUrl}/token`, {
            username: 'farmer', 
            password: 'password'
        });
        return { Authorization: `Bearer ${res.data.token}` };
    };

    it('should create an animal type, generate a slug, and allow fetching stats by that slug', async () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL; // e.g. .../wp-json/wp/v2
        const rootApi = apiBase.replace('/wp/v2', '');     // e.g. .../wp-json
        const headers = await getHeaders();

        // 1. Create a Unique Animal Type
        const rand = Math.floor(Math.random() * 10000);
        const title = `Slug Test ${rand}`;
        
        console.log(`Creating Animal Type: "${title}"...`);
        
        const createRes = await axios.post(`${apiBase}/farm_type`, {
            title: title,
            status: 'publish',
            farm_icon: 'paw'
        }, { headers });

        const createdId = createRes.data.id;
        const createdSlug = createRes.data.slug; // WordPress returns this automatically

        console.log(`Created ID: ${createdId}, Generated Slug: "${createdSlug}"`);

        // ASSERT: WordPress must generate a slug
        expect(createdSlug).toBeDefined();
        expect(createdSlug).not.toBe('');
        // It should look like "slug-test-1234"
        expect(createdSlug).toContain('slug-test');

        // 2. Try to Fetch Stats using the SLUG (The critical part)
        const statsUrl = `${rootApi}/farm/v1/stats/type/${createdSlug}`;
        console.log(`Attempting to fetch stats from: ${statsUrl}`);

        try {
            const statsRes = await axios.get(statsUrl, { headers });
            
            // 3. Verify Response
            expect(statsRes.status).toBe(200);
            expect(statsRes.data).toHaveProperty('population');
            console.log("SUCCESS: API accepted the slug.");

        } catch (error: any) {
            console.error("FAILURE: API rejected the slug.", error.response?.status, error.response?.data);
            throw error; // Fail the test
        } finally {
            // 4. Cleanup (Delete the test type)
            await axios.delete(`${apiBase}/farm_type/${createdId}?force=true`, { headers });
            console.log("Cleanup complete.");
        }
    });
});