import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import Auth

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const useBreeds = (parentTypeId?: number) => {
    const { user } = useAuth(); 

    return useQuery({
        queryKey: ['breeds', parentTypeId],
        queryFn: async () => {
            if (!parentTypeId) return [];
            
            // Scalable Server-Side Filtering
            const res = await axios.get(`${API_BASE}/farm_breed`, {
                params: { 
                    farm_parent_type: parentTypeId,
                    per_page: 100 
                }
            });
            return res.data;
        },
        enabled: !!parentTypeId && !!user?.token
    });
};