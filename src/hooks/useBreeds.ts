import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const useBreeds = (parentTypeId?: number, page = 1, fetchAll = false) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['breeds', parentTypeId, page, fetchAll, user?.token],
        queryFn: async () => {
            if (!parentTypeId) return { data: [], total: 0, totalPages: 0 };
            
            const params: any = { farm_parent_type: parentTypeId };
            if (fetchAll) {
                params.per_page = 100;
            } else {
                params.page = page;
                params.per_page = 10;
            }

            const res = await axios.get(`${API_BASE}/farm_breed`, { params });
            return {
                data: res.data,
                total: Number(res.headers['x-wp-total'] || 0),
                totalPages: Number(res.headers['x-wp-totalpages'] || 0)
            };
        },
        enabled: !!parentTypeId && !!user?.token
    });
};