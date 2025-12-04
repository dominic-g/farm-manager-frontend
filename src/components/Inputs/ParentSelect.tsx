import { useState, useEffect } from 'react';
import { Select, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useDebouncedValue } from '@mantine/hooks';

interface Props {
    typeId: number;
    gender: 'male' | 'female';
    value: string | null;
    onChange: (val: string | null) => void;
    label: string;
    excludeId?: number; // Don't allow an animal to be its own parent

    childDob: Date; // The child's date of birth
    config: any; 
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function ParentSelect({ typeId, gender, value, onChange, label, excludeId, childDob, config  }: Props) {
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchValue, 300);
    const [error, setError] = useState<string | null>(null);

    const calculateMaxDob = () => {
        if (!childDob) return undefined;
        
        const daysToSubtract = gender === 'female'
            ? (config?.maturity?.female || 0) + (config?.gestation || 0)
            : (config?.maturity?.male || 0); // Males don't have gestation constraint for conception, just maturity

        const maxDate = new Date(childDob);
        maxDate.setDate(maxDate.getDate() - daysToSubtract);
        return maxDate.toISOString().split('T')[0];
    };

    const maxDob = calculateMaxDob();

    // Fetch potential parents based on search
    const { data, isLoading } = useQuery({
        queryKey: ['parentSearch', typeId, gender, debouncedSearch, maxDob],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/animals`, {
                params: {
                    type_id: typeId,
                    gender: gender,
                    search: debouncedSearch,
                    status: 'active',
                    max_dob: maxDob
                }
            });
            return res.data;
        },
        enabled: !!typeId
    });

    useEffect(() => {
        if (!value || !maxDob) return;

        // If the current selected parent is NOT in the new valid list...
        // Note: This logic depends on whether 'data' contains the current value.
        // Since 'data' relies on search, we might need a separate check or just trust the backend filter.
        
        // A simpler client-side check if we had the parent's DOB loaded.
        // For now, we rely on the fact that if they search again, invalid ones won't show.
        // But to be safe, we reset error.
        setError(null);

    }, [childDob, value]);

    const options = data?.map((animal: any) => ({
        value: String(animal.ID),
        label: `${animal.tag} (${animal.breed_names || 'Unknown Breed'})`,
        disabled: excludeId ? animal.ID === excludeId : false
    })) || [];

    return (
        <Select
            label={label}
            placeholder={`Search ${gender} tag...`}
            data={options}
            value={value ? String(value) : null}
            onChange={onChange}
            searchable
            onSearchChange={setSearchValue}
            clearable
            nothingFoundMessage={isLoading ? <Loader size="xs" /> : "No animals found"}
            filter={({ options }) => options} // Server-side filtering
            error={error}
            description={maxDob ? `Must be born before ${maxDob}` : ''}
        />
    );
}