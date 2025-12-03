import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export interface AnimalType {
    id: number;
    slug: string;
    title: { raw: string; rendered: string };
    farm_lifecycle?: any; // We'll define exact types later
    farm_feed?: any[];
    farm_health?: any[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const useAnimalTypes = () => {
    const { user } = useAuth();
    
    return useQuery({
        queryKey: ['animalTypes', user?.token],
        queryFn: async () => {
            const response = await axios.get<AnimalType[]>(`${API_BASE}/farm_type`);
            return response.data;
        },
        enabled: !!user?.token, // Only fetch if logged in
    });
};

