import { useState, useMemo, useEffect } from 'react';
import { Modal, Select, TextInput, NumberInput, Button, Group, Stack, Text, Checkbox, Divider, SegmentedControl, Autocomplete } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useSettings } from '../../context/SettingsContext';
import { useQuery } from '@tanstack/react-query';

interface Props {
    opened: boolean;
    close: () => void;
    animalIds?: number[];
    groupId?: number;
    initialEventType?: string;
    parentType?: any;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function LogEventModal({ opened, close, animalIds, groupId, initialEventType, parentType }: Props) {
    const queryClient = useQueryClient();
    const { settings } = useSettings();

    // 1. Fetch Inventory
    const { data: inventory } = useQuery({
        queryKey: ['inventory_list'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/resources`);
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        }
    });

    const form = useForm({
        initialValues: {
            event_type: initialEventType || 'feed',
            date: new Date(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            value: '', 
            dead_weight: '',
            meat_weight: '',
            sold_qty: '',
            income: '',
            feed_name: '',
            feed_source: 'inventory',
            resource_id: '',
            notes: '',
            cost: '',
            is_total_value: false,
        },
    });

    // 2. Filter Inventory
    const inventoryOptions = inventory
        ?.filter((item: any) => {
            // Basic Type Match
            if (form.values.event_type === 'feed' && item.type !== 'feed') return false;
            if (form.values.event_type === 'medical' && item.type !== 'medicine') return false;
            
            // Animal Restriction Logic
            let allowedTypes: string[] = [];
            if (item.target_type_ids) {
                try {
                    const parsed = typeof item.target_type_ids === 'string' 
                        ? JSON.parse(item.target_type_ids) 
                        : item.target_type_ids;
                    if (Array.isArray(parsed)) allowedTypes = parsed.map(String);
                } catch(e) {}
            }

            // If restricted, check compatibility
            if (allowedTypes.length > 0 && parentType?.id) {
                if (!allowedTypes.includes(String(parentType.id))) return false;
            }

            // If allowedTypes is empty, it returns true (Available to all)
            return true;
        })
        .map((item: any) => ({
            value: String(item.id),
            label: `${item.name} (${item.stock_current} ${item.unit} avail)` 
        })) || [];

    // Feed Autocomplete Logic
    const availableFeeds = useMemo(() => {
        if (!parentType?.farm_feed) return [];
        const feeds = new Set<string>();
        parentType.farm_feed.forEach((stage: any) => {
            stage.items?.forEach((item: any) => feeds.add(item.name));
        });
        return Array.from(feeds);
    }, [parentType]);
    
    // Sync Prop
    useEffect(() => {
        if (opened && initialEventType) {
            form.setFieldValue('event_type', initialEventType);
        }
    }, [opened, initialEventType]);

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const dateTime = new Date(values.date);
            const [hours, minutes] = values.time.split(':');
            dateTime.setHours(Number(hours), Number(minutes));

            const payload = {
                animal_ids: animalIds,
                group_id: groupId,
                event_type: values.event_type,
                event_date: dateTime.toISOString(),
                value: values.value,
                notes: values.notes,
                cost: values.cost,
                income: values.income,
                is_total_value: values.is_total_value,
                
                // Details
                feed_source: values.feed_source,
                feed_name: values.feed_name,
                dead_weight: values.dead_weight,
                meat_weight: values.meat_weight,
                sold_qty: values.sold_qty,

                resource_id: values.feed_source === 'inventory' ? values.resource_id : null
            };
            return axios.post(`${API_BASE}/logs`, payload);
        },
        onSuccess: (res) => {
            notifications.show({ title: 'Logged', message: res.data.message, color: 'green' });
            queryClient.invalidateQueries();
            close();
            form.reset();
        },
        onError: (err: any) => {
            notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
        }
    });

    const isMultiTarget = (animalIds && animalIds.length > 1) || !!groupId;
    const type = form.values.event_type;

    // Helper Labels
    const isFeed = type === 'feed';
    const isMedical = type === 'medical';
    
    // Dynamic Labels based on Type
    const getTypeConfig = (type: string) => {
        switch(type) {
            case 'feed': return { valLabel: `Amount (${settings.weightUnit})`, noteLabel: 'Notes', showTotal: true };
            case 'weight': return { valLabel: `New Weight (${settings.weightUnit})`, noteLabel: 'Notes', showTotal: false };
            case 'medical': return { valLabel: 'Dosage (ml/mg)', noteLabel: 'Notes', showTotal: false };
            case 'produce_egg': return { valLabel: 'Quantity (Count)', noteLabel: 'Notes', showTotal: true };
            case 'produce_milk': return { valLabel: 'Volume (Liters)', noteLabel: 'Notes', showTotal: true };
            case 'death': return { valLabel: 'N/A', noteLabel: 'Cause of Death', showTotal: false };
            case 'sale': return { valLabel: `Sale Price (${settings.currency})`, noteLabel: 'Buyer Name', showTotal: true };
            default: return { valLabel: 'Value', noteLabel: 'Notes', showTotal: false };
        }
    };

    const config = getTypeConfig(type);

    return (
        <Modal opened={opened} onClose={close} title="Log Activity" size="lg">
            <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
                <Stack>
                    <Group grow>
                        <Select 
                            label="Event Type"
                            data={[
                                { group: 'Daily', items: [ { value: 'feed', label: 'Feed' }, { value: 'produce_milk', label: 'Milk' }, { value: 'produce_egg', label: 'Eggs' } ]},
                                { group: 'Health', items: [ { value: 'weight', label: 'Weight' }, { value: 'medical', label: 'Medical' } ]},
                                { group: 'Lifecycle', items: [ { value: 'sale', label: 'Sold (Live)' }, { value: 'slaughter', label: 'Slaughtered' }, { value: 'death', label: 'Died' } ]}
                            ]}
                            {...form.getInputProps('event_type')}
                        />
                        <Group grow gap={5}>
                            <DatePickerInput label="Date" maxDate={new Date()} {...form.getInputProps('date')} />
                            <TimeInput label="Time" {...form.getInputProps('time')} />
                        </Group>
                    </Group>

                    <Divider />

                    {/* --- FEED & MEDICAL LOGIC (INVENTORY SOURCE) --- */}
                    {(isFeed || isMedical) && (
                        <>
                            <Text size="sm" fw={500} mt="sm">Source</Text>
                            <SegmentedControl
                                fullWidth
                                data={[
                                    { label: 'From Inventory', value: 'inventory' },
                                    { label: 'Direct Purchase', value: 'direct' }
                                ]}
                                {...form.getInputProps('feed_source')}
                            />

                            {form.values.feed_source === 'inventory' ? (
                                <Select 
                                    label={isFeed ? "Select Feed Item" : "Select Medicine"}
                                    placeholder="Choose from stock..."
                                    data={inventoryOptions}
                                    searchable
                                    nothingFoundMessage="Item not found in inventory"
                                    {...form.getInputProps('resource_id')}
                                    mt="sm"
                                />
                            ) : (
                                isFeed ? (
                                    <Autocomplete 
                                        label="Feed Name"
                                        placeholder="e.g. Napier Grass"
                                        data={availableFeeds}
                                        mt="sm"
                                        {...form.getInputProps('feed_name')}
                                    />
                                ) : (
                                    <TextInput 
                                        label="Medicine Name"
                                        placeholder="e.g. Antibiotics"
                                        mt="sm"
                                        {...form.getInputProps('feed_name')} // Reusing feed_name field for simplicity in DB
                                    />
                                )
                            )}

                            <TextInput 
                                label={config.valLabel} 
                                placeholder="0.00" type="number" 
                                mt="sm"
                                required
                                {...form.getInputProps('value')} 
                            />
                            
                            {/* Cost Input: Only for Direct Purchase */}
                            {form.values.feed_source === 'direct' && (
                                <NumberInput 
                                    label={`Cost (${settings.currency})`} 
                                    mt="sm"
                                    {...form.getInputProps('cost')} 
                                />
                            )}
                        </>
                    )}

                    {/* --- OTHER TYPES (Weight, Production) --- */}
                    {!isFeed && !isMedical && type !== 'slaughter' && type !== 'sale' && type !== 'death' && (
                        <TextInput 
                            label={config.valLabel} 
                            type="number"
                            {...form.getInputProps('value')} 
                        />
                    )}

                    {/* --- SLAUGHTER / SALE LOGIC (Keep existing) --- */}
                    {type === 'slaughter' && (
                        <>
                            <Group grow>
                                <TextInput label={`Live Weight (${settings.weightUnit})`} type="number" {...form.getInputProps('value')} />
                                <TextInput label={`Carcass Weight (${settings.weightUnit})`} type="number" {...form.getInputProps('dead_weight')} />
                                <TextInput label={`Meat Weight (${settings.weightUnit})`} type="number" {...form.getInputProps('meat_weight')} />
                            </Group>
                            <Divider label="Sales (Optional)" labelPosition="center" />
                            <Group grow>
                                <TextInput label={`Meat Sold (${settings.weightUnit})`} type="number" {...form.getInputProps('sold_qty')} />
                                <TextInput label={`Income (${settings.currency})`} type="number" {...form.getInputProps('income')} />
                            </Group>
                        </>
                    )}

                    {type === 'sale' && (
                        <Group grow>
                            <TextInput label={`Sold Weight (${settings.weightUnit})`} type="number" {...form.getInputProps('value')} />
                            <TextInput label={`Total Income (${settings.currency})`} type="number" required {...form.getInputProps('income')} />
                        </Group>
                    )}

                    {/* MULTI-TARGET DIVISOR */}
                    {isMultiTarget && (['feed', 'sale', 'slaughter', 'produce_milk', 'produce_egg'].includes(type)) && (
                        <Checkbox 
                            mt="md"
                            label="These values are TOTALS for the group (Divide equally per animal)"
                            {...form.getInputProps('is_total_value', { type: 'checkbox' })}
                        />
                    )}

                    <TextInput label={config.noteLabel} placeholder="..." mt="md" {...form.getInputProps('notes')} />

                    <Button type="submit" loading={mutation.isPending} mt="xl" fullWidth>Save Record</Button>
                </Stack>
            </form>
        </Modal>
    );
}