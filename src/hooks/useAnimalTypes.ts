import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export interface AnimalType {
    id: number;
    slug: string;
    title: { raw: string; rendered: string };
    farm_icon?: string;
    farm_lifecycle?: any;
    farm_feed?: any[];
    farm_health?: any[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const useAnimalTypes = (page = 1, perPage = 10) => {
    const { user } = useAuth();
    
    return useQuery({
        queryKey: ['animalTypes', user?.token, page, perPage],
        queryFn: async () => {
            const response = await axios.get(`${API_BASE}/farm_type`, {
                params: { page, per_page: perPage }
            });
            // Handle both array response (unpaginated) and envelope (if we add headers later)
            // But standard WP returns array and headers.
            return {
                data: response.data as AnimalType[],
                total: Number(response.headers['x-wp-total'] || 0),
                totalPages: Number(response.headers['x-wp-totalpages'] || 0)
            };
        },
        enabled: !!user?.token,
        placeholderData: (prev) => prev
    });
};