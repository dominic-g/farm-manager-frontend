import { describe, it, expect } from 'vitest';

describe('App Configuration', () => {
    it('should have the correct API Base URL defined', () => {
        // Vite exposes env variables on import.meta.env
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        
        // We expect it to be defined (not undefined)
        expect(apiUrl).toBeDefined();
        
        // It should contain 'wp-json' if configured correctly
        expect(apiUrl).toContain('wp-json');
    });
});