import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export interface FarmGroup {
    id: number;
    name: string;
}

export const useGroups = (animalTypeId?: number, page = 1, fetchAll = false) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const query = useQuery({
        queryKey: ['groups', animalTypeId, page, fetchAll, user?.token],
        queryFn: async () => {
            if (!animalTypeId) return { data: [], total: 0, totalPages: 0 };
            
            const params: any = { animal_type_id: animalTypeId };
            if (fetchAll) {
                params.per_page = 100;
            } else {
                params.page = page;
                params.per_page = 10;
            }

            const res = await axios.get(`${API_BASE}/groups`, { params });
            return {
                data: res.data as FarmGroup[],
                total: Number(res.headers['x-wp-total'] || 0),
                totalPages: Number(res.headers['x-wp-totalpages'] || 0)
            };
        },
        enabled: !!animalTypeId && !!user?.token
    });

    const createMutation = useMutation({
        mutationFn: async (name: string) => {
            return axios.post(`${API_BASE}/groups`, {
                name,
                animal_type_id: animalTypeId
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            notifications.show({ title: 'Success', message: `Group "${data.data.name}" created`, color: 'green' });
        },
        onError: (err: any) => {
            notifications.show({ 
                title: 'Error', 
                message: err.response?.data?.message || 'Failed to create group', 
                color: 'red' 
            });
        }
    });

    return { ...query, createGroup: createMutation.mutateAsync };
};