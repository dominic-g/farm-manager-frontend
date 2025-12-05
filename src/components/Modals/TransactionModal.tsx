import { useState, useEffect } from 'react';
import { Modal, Select, TextInput, NumberInput, Button, Group, Stack, SegmentedControl, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useSettings } from '../../context/SettingsContext';
import { useAnimalTypes } from '../../hooks/useAnimalTypes';
import { useGroups } from '../../hooks/useGroups';

interface Props {
    opened: boolean;
    close: () => void;
    initialType?: 'income' | 'expense';
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function TransactionModal({ opened, close, initialType = 'expense' }: Props) {
    const queryClient = useQueryClient();
    const { settings } = useSettings();
    
    // Fetch Linkable Options
    const { data: typeData } = useAnimalTypes(1, 100);
    const animalTypes = typeData?.data || [];
    
    const [linkContext, setLinkContext] = useState<string>('general'); // general, group
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Fetch Groups if a Type is selected
    const { data: groupData } = useGroups(selectedType ? Number(selectedType) : undefined, 1, true);
    const groups = groupData?.data || [];

    const form = useForm({
        initialValues: {
            type: initialType,
            date: new Date(),
            amount: '',
            category: '',
            description: '',
            link_id: '', 
        },
        validate: {
            amount: (val) => (val > 0 ? null : 'Amount required'),
            description: (val) => (val.length > 0 ? null : 'Description required'),
        }
    });

    // 1. FIX: Sync initialType when modal opens
    useEffect(() => {
        if (opened) {
            form.setFieldValue('type', initialType);
        }
    }, [opened, initialType]);

    // 3. FIX: Reset Group selection when Type changes
    const handleTypeChange = (val: string | null) => {
        setSelectedType(val);
        form.setFieldValue('link_id', ''); // Clear the group selection
    };

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const commonData = {
                amount: values.amount,
                date: values.date.toISOString(),
                description: values.description,
                category: values.category || 'General',
            };

            // SCENARIO 1: General (Unlinked) - Direct Finance API
            if (linkContext === 'general') {
                return axios.post(`${API_BASE}/finance`, {
                    ...commonData,
                    type: values.type
                });
            }

            // SCENARIO 2: Linked (Distributed via Logs API)
            const eventType = values.type === 'income' ? 'money_income' : 'money_expense';
            
            // 4. FIX: STRICTLY SEPARATE COST AND INCOME
            // Previous bug: we sent 'cost: amount' always. Backend sees 'cost > 0' and creates Expense.
            const costValue = values.type === 'expense' ? values.amount : 0;
            const incomeValue = values.type === 'income' ? values.amount : 0;

            const payload = {
                event_type: eventType,
                event_date: values.date.toISOString(),
                group_id: values.link_id,
                
                // The Fix:
                cost: costValue, 
                income: incomeValue,
                
                is_total_value: true, // Divide amount among animals
                value: 0, // No physical weight/qty
                notes: values.description,
            };

            return axios.post(`${API_BASE}/logs`, payload);
        },
        onSuccess: () => {
            notifications.show({ title: 'Success', message: 'Transaction recorded', color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            close();
            form.reset();
            setLinkContext('general');
            setSelectedType(null);
        },
        onError: (err: any) => {
            notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed', color: 'red' });
        }
    });

    const categoryOptions = form.values.type === 'income' 
        ? ['Sales', 'Manure', 'By-products', 'Grants', 'Other'] 
        : ['Feed', 'Medicine', 'Equipment', 'Labor', 'Maintenance', 'Other'];

    // 2. FIX: Dynamic Placeholders
    const descPlaceholder = form.values.type === 'income' 
        ? "e.g. Sold 5 bags of manure" 
        : "e.g. Barn roof repair material";

    return (
        <Modal opened={opened} onClose={close} title={`Add ${form.values.type === 'income' ? 'Income' : 'Expense'}`}>
            <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
                <Stack>
                    <SegmentedControl
                        fullWidth
                        data={[
                            { label: 'Income (+)', value: 'income' },
                            { label: 'Expense (-)', value: 'expense' }
                        ]}
                        {...form.getInputProps('type')}
                        color={form.values.type === 'income' ? 'teal' : 'red'}
                    />

                    <Group grow>
                        <NumberInput 
                            label={`Amount (${settings.currency})`} 
                            placeholder="0.00" 
                            min={0}
                            required 
                            {...form.getInputProps('amount')} 
                        />
                        <DatePickerInput label="Date" {...form.getInputProps('date')} />
                    </Group>

                    <TextInput 
                        label="Description" 
                        placeholder={descPlaceholder} // Used here
                        required 
                        {...form.getInputProps('description')} 
                    />

                    <Select 
                        label="Category" 
                        data={categoryOptions} 
                        searchable
                        creatable
                        getCreateLabel={(query) => `+ ${query}`}
                        onCreate={(query) => query}
                        {...form.getInputProps('category')}
                    />

                    {/* LINKING SECTION */}
                    <Text size="sm" fw={500} mt="sm">Link to (Optional)</Text>
                    <SegmentedControl 
                        size="xs"
                        data={[
                            { label: 'General Farm', value: 'general' },
                            { label: 'Specific Group', value: 'group' }
                        ]}
                        value={linkContext}
                        onChange={setLinkContext}
                    />

                    {linkContext === 'group' && (
                        <Group grow>
                            <Select 
                                placeholder="Filter by Animal Type"
                                data={animalTypes.map(t => ({ value: String(t.id), label: t.title.rendered }))}
                                value={selectedType}
                                onChange={handleTypeChange} // Used here
                            />
                            <Select 
                                placeholder="Select Group"
                                disabled={!selectedType}
                                data={groups.map((g: any) => ({ value: String(g.id), label: g.name }))}
                                {...form.getInputProps('link_id')}
                            />
                        </Group>
                    )}

                    <Button 
                        type="submit" 
                        color={form.values.type === 'income' ? 'teal' : 'red'} 
                        loading={mutation.isPending} 
                        mt="md"
                    >
                        Record Transaction
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}