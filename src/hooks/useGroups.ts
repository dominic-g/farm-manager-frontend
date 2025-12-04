import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export interface FarmGroup {
    id: number;
    name: string;
}

export const useGroups = (animalTypeId?: number) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['groups', animalTypeId],
        queryFn: async () => {
            if (!animalTypeId) return [];
            const res = await axios.get(`${API_BASE}/groups?animal_type_id=${animalTypeId}`);
            return res.data as FarmGroup[];
        },
        enabled: !!animalTypeId
    });

    const createMutation = useMutation({
        mutationFn: async (name: string) => {
            return axios.post(`${API_BASE}/groups`, {
                name,
                animal_type_id: animalTypeId
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['groups', animalTypeId] });
            notifications.show({ title: 'Success', message: 'Group created', color: 'green' });
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