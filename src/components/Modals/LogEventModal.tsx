import { useState, useMemo, useEffect } from 'react';
import { Modal, Select, TextInput, NumberInput, Button, Group, Stack, Text, Checkbox, Divider, SegmentedControl, Autocomplete } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useSettings } from '../../context/SettingsContext';

interface Props {
    opened: boolean;
    close: () => void;
    // Context: Who are we logging for?
    animalIds?: number[]; // Single or Bulk IDs
    groupId?: number;     // Or a Group ID
    initialEventType?: string;
    parentType?: any
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function LogEventModal({ opened, close, animalIds, groupId, initialEventType, parentType }: Props) {
    const queryClient = useQueryClient();
    const { settings } = useSettings();

    // Feed Logic: Extract feeds from parentType config
    const availableFeeds = useMemo(() => {
        if (!parentType?.farm_feed) return [];
        // Flatten all stages to get unique feed names
        const feeds = new Set<string>();
        parentType.farm_feed.forEach((stage: any) => {
            stage.items?.forEach((item: any) => feeds.add(item.name));
        });
        return Array.from(feeds);
    }, [parentType]);
    
    const form = useForm({
        initialValues: {
            event_type: initialEventType || 'feed',
            date: new Date(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            
            value: '', // Primary (Live Weight, Milk L, Feed kg)
            
            // Slaughter Specifics
            dead_weight: '',
            meat_weight: '',
            
            // Sales/Production Specifics
            sold_qty: '',
            income: '',
            
            // Feed Specifics
            feed_name: '',
            feed_source: 'inventory', // inventory vs direct
            
            notes: '',
            cost: '',
            is_total_value: false, // "Divide among group"
        },
    });
    // SYNC PROP TO FORM: When modal opens, update the event type
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
            };
            return axios.post(`${API_BASE}/logs`, payload);
        },
        onSuccess: (res) => {
            notifications.show({ title: 'Logged', message: res.data.message, color: 'green' });
            // queryClient.invalidateQueries({ queryKey: ['animal'] }); // Refresh Profile
            // queryClient.invalidateQueries({ queryKey: ['typeStats'] }); // Refresh Dashboard
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

    // Dynamic Labels based on Type
    const getTypeConfig = (type: string) => {
        switch(type) {
            case 'feed': return { valLabel: 'Amount (kg)', noteLabel: 'Feed Name (e.g. Starter)', showTotal: true };
            case 'weight': return { valLabel: 'New Weight (kg)', noteLabel: 'Notes', showTotal: false };
            case 'medical': return { valLabel: 'Dosage (ml/mg)', noteLabel: 'Medication Name', showTotal: false };
            case 'produce_egg': return { valLabel: 'Quantity (Count)', noteLabel: 'Notes', showTotal: true };
            case 'produce_milk': return { valLabel: 'Volume (Liters)', noteLabel: 'Notes', showTotal: true };
            case 'death': return { valLabel: 'N/A', noteLabel: 'Cause of Death', showTotal: false };
            case 'sale': return { valLabel: 'Sale Price (Total)', noteLabel: 'Buyer Name', showTotal: true };
            default: return { valLabel: 'Value', noteLabel: 'Notes', showTotal: false };
        }
    };

    const config = getTypeConfig(form.values.event_type);
    // const isMultiTarget = (animalIds && animalIds.length > 1) || !!groupId;

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

                    {/* --- FEED LOGIC --- */}
                    {type === 'feed' && (
                        <>
                            <Group grow align="flex-end">
                                <Autocomplete 
                                    label="Feed Type"
                                    placeholder="Select or Type..."
                                    data={availableFeeds}
                                    {...form.getInputProps('feed_name')}
                                />
                                <TextInput 
                                    label={`Amount (${settings.weightUnit})`} 
                                    placeholder="0.00" type="number" 
                                    {...form.getInputProps('value')} 
                                />
                            </Group>
                            
                            <Text size="sm" fw={500} mt="sm">Source</Text>
                            <SegmentedControl
                                fullWidth
                                data={[
                                    { label: 'From Inventory (Implied Cost)', value: 'inventory' },
                                    { label: 'Bought Directly (New Expense)', value: 'direct' }
                                ]}
                                {...form.getInputProps('feed_source')}
                            />
                            
                            {form.values.feed_source === 'direct' && (
                                <NumberInput 
                                    label={`Cost (${settings.currency})`} 
                                    description="Enter the amount you paid just now"
                                    {...form.getInputProps('cost')} 
                                />
                            )}
                        </>
                    )}

                    {/* --- WEIGHT LOGIC --- */}
                    {type === 'weight' && (
                        <TextInput 
                            label={`New Weight (${settings.weightUnit})`} 
                            type="number"
                            {...form.getInputProps('value')} 
                        />
                    )}

                    {/* --- PRODUCTION LOGIC --- */}
                    {(type === 'produce_milk' || type === 'produce_egg') && (
                        <>
                            <TextInput 
                                label={`Quantity Produced (${type === 'produce_milk' ? 'L' : 'Count'})`} 
                                type="number"
                                {...form.getInputProps('value')} 
                            />
                            <Divider label="Sales (Optional)" labelPosition="center" />
                            <Group grow>
                                <TextInput 
                                    label="Quantity Sold" 
                                    type="number"
                                    placeholder="Leave empty if none sold"
                                    {...form.getInputProps('sold_qty')}
                                />
                                <TextInput 
                                    label={`Income (${settings.currency})`}
                                    type="number"
                                    placeholder="Amount received"
                                    disabled={!form.values.sold_qty}
                                    {...form.getInputProps('income')}
                                />
                            </Group>
                        </>
                    )}

                    {/* --- SLAUGHTER LOGIC --- */}
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

                    {/* --- SALE (LIVE) LOGIC --- */}
                    {type === 'sale' && (
                        <Group grow>
                            <TextInput label={`Sold Weight (${settings.weightUnit})`} type="number" {...form.getInputProps('value')} />
                            <TextInput label={`Total Income (${settings.currency})`} type="number" required {...form.getInputProps('income')} />
                        </Group>
                    )}

                    {/* MULTI-TARGET DIVISOR CHECKBOX */}
                    {isMultiTarget && (['feed', 'sale', 'slaughter', 'produce_milk', 'produce_egg'].includes(type)) && (
                        <Checkbox 
                            mt="md"
                            label="These values are TOTALS for the group (Divide equally per animal)"
                            {...form.getInputProps('is_total_value', { type: 'checkbox' })}
                        />
                    )}

                    {/* COMMON NOTES */}
                    <TextInput label="Notes" placeholder="Optional details..." mt="md" {...form.getInputProps('notes')} />

                    <Button type="submit" loading={mutation.isPending} mt="xl" fullWidth>Save Record</Button>
                </Stack>
            </form>
        </Modal>
    );
}