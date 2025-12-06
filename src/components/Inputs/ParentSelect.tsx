import { useState, useEffect } from 'react';
import { Select, Loader, Group, Text, Badge, ThemeIcon } from '@mantine/core';
import type { ComboboxItem } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useDebouncedValue } from '@mantine/hooks';
import { IconAlertTriangle, IconCheck, IconLink } from '@tabler/icons-react';

interface Props {
    typeId: number;
    gender: 'male' | 'female';
    value: string | null;
    onChange: (val: string | null) => void;
    label: string;
    childDob?: Date; 
    config?: any;
    
    // NEW: Pass the "Other Parent" (The Female/Male we are mating with)
    compareWith?: any; 
    allowExternal?: boolean; // If true, allows selecting "External/AI" logic handled in parent
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function ParentSelect({ typeId, gender, value, onChange, label, childDob, config, compareWith }: Props) {
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchValue, 300);

    // Calculate Max DOB Logic (Same as before)
    const calculateMaxDob = () => {
        if (!childDob) return undefined;
        // Logic remains same...
        const daysToSubtract = gender === 'female'
            ? (config?.maturity?.female || 0) + (config?.gestation || 0)
            : (config?.maturity?.male || 0); 
        const maxDate = new Date(childDob);
        maxDate.setDate(maxDate.getDate() - daysToSubtract);
        return maxDate.toISOString().split('T')[0];
    };
    const maxDob = calculateMaxDob();

    const { data, isLoading } = useQuery({
        queryKey: ['parentSearch', typeId, gender, debouncedSearch, maxDob],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/animals`, {
                params: {
                    type_id: typeId,
                    gender: gender,
                    search: debouncedSearch,
                    status: 'active',
                    max_dob: maxDob,
                    per_page: 50
                }
            });
            return res.data;
        },
        enabled: !!typeId
    });

    // --- RELATIONSHIP CHECKER ---
    const checkRelationship_ = (candidate: any) => {
        if (!compareWith) return { color: 'green', label: 'Safe', risk: 0 }; // No comparison target

        const female = compareWith; 
        const male = candidate;

        // 1. Direct Sibling (Share Parent)
        // Check if Male's Sire == Female's Sire OR Male's Dam == Female's Dam
        const shareSire = male.parents.sire_id && female.parents.sire?.id && String(male.parents.sire_id) === String(female.parents.sire.id);
        const shareDam = male.parents.dam_id && female.parents.dam?.id && String(male.parents.dam_id) === String(female.parents.dam.id);

        if (shareSire || shareDam) {
            return { color: 'red', label: 'Sibling', risk: 3 };
        }

        // 2. Parent-Child (Direct Lineage)
        // Is Male the Father of Female? Or Female mother of Male?
        if (String(female.parents.sire?.id) === String(male.ID) || String(female.parents.dam?.id) === String(male.ID)) {
             return { color: 'red', label: 'Parent', risk: 3 };
        }

        // 3. Cousins (Share Grandparent)
        // Compare Male's Grandparents vs Female's Grandparents
        const maleGPs = Object.values(male.grandparents || {}).filter(Boolean);
        const femaleGPs = [
            // We need female grandparent IDs. 
            // Note: Frontend 'animal' object usually has detailed parents, but maybe not grandparents loaded.
            // If data is missing, we skip this check or need 'compareWith' to be richer.
            // Assuming compareWith is the full Profile object which has loaded parents:
            // But usually Profile doesn't load Grandparents IDs flatly.
            // LIMITATION: We can only check if we have the data.
        ];
        
        // Simplified Cousin Check (if data available)
        // For now, let's assume Green unless Sibling.
        return { color: 'green', label: 'Safe', risk: 0 };
    };

        const checkRelationship = (candidate: any) => {
        // 1. If no comparison animal (e.g. creating new animal), it's safe
        if (!compareWith) return { color: 'green', label: 'Safe' };

        // 2. Safety Check: If candidate data is incomplete, we can't check
        if (!candidate || !candidate.parents) return { color: 'gray', label: 'Unknown' };

        const target = compareWith; 
        const candidateParents = candidate.parents;
        
        // 3. Normalize IDs 
        // (Handle differences between List API and Details API structures)
        const candSire = candidateParents.sire_id;
        const candDam = candidateParents.dam_id;

        // Target might be from 'details' endpoint (parents.sire.id) or 'list' endpoint (parents.sire_id)
        const targetSire = target.parents?.sire?.id || target.parents?.sire_id;
        const targetDam = target.parents?.dam?.id || target.parents?.dam_id;

        // 4. Sibling Check (Share a parent)
        const shareSire = candSire && targetSire && String(candSire) === String(targetSire);
        const shareDam = candDam && targetDam && String(candDam) === String(targetDam);

        if (shareSire || shareDam) {
            return { color: 'red', label: 'Sibling' };
        }

        // 5. Parent-Child Check
        // Is Candidate the parent of Target?
        if ( (targetSire && String(targetSire) === String(candidate.ID)) || 
             (targetDam && String(targetDam) === String(candidate.ID)) ) {
             return { color: 'red', label: 'Parent' };
        }

        // Is Target the parent of Candidate?
        if ( (candSire && String(candSire) === String(target.id)) || 
             (candDam && String(candDam) === String(target.id)) ) {
             return { color: 'red', label: 'Child' };
        }

        return { color: 'teal', label: 'Safe' };
    };

    // Custom Item Renderer
    const renderOption = ({ option }: { option: ComboboxItem }) => {
        const candidate = data?.find((d: any) => String(d.ID) === option.value);
        const relation = candidate ? checkRelationship(candidate) : { color: 'gray', label: 'Unknown' };

        return (
            <Group justify="space-between" wrap="nowrap">
                <div>
                    <Text size="sm">{candidate?.tag}</Text>
                    <Text size="xs" c="dimmed">{candidate?.breed_names}</Text>
                </div>
                {compareWith && (
                    <Badge color={relation.color} size="xs" variant="light">
                        {relation.label}
                    </Badge>
                )}
            </Group>
        );
    };

    const options = data?.map((animal: any) => ({
        value: String(animal.ID),
        label: animal.tag,
    })) || [];

    return (
        <Select
            label={label}
            placeholder={`Search ${gender}...`}
            data={options}
            value={value ? String(value) : null}
            onChange={onChange}
            searchable
            onSearchChange={setSearchValue}
            clearable
            renderOption={renderOption} // <--- Use Custom Renderer
            // nothingFoundMessage={isLoading ? <Loader size="xs"/> : `No ${gender}s found`}
            nothingFoundMessage={
                !typeId ? "Loading settings..." : 
                isLoading ? <Loader size="xs"/> : 
                `No ${gender}s found (older than maturity age)`
            }
            description={maxDob ? `Must be older than maturity age` : ''}
        />
    );
}