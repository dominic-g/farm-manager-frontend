import { useState } from 'react';
import { Modal, TextInput, Button, Group, Tabs, NumberInput, Select, Stack, Divider, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { ParentSelect } from '../Inputs/ParentSelect';

interface Props {
    opened: boolean;
    close: () => void;
    group: any; // The group object
    typeId: number; // To filter parents/feeds
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function GroupActionModal({ opened, close, group, typeId, parentType }: Props) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string | null>('settings');

    const [refDate, setRefDate] = useState(new Date());

    // Form for Settings (Name/Parents)
    const settingsForm = useForm({
        initialValues: {
            name: group?.name || '',
            sire_id: '',
            dam_id: ''
        },
    });

    // Form for Logging (Feed/Weight/Vet)
    const logForm = useForm({
        initialValues: {
            date: new Date(),
            type: 'feed', // feed, weight, medical
            value: '', // amount
            notes: ''
        }
    });

    const settingsMutation = useMutation({
        mutationFn: async (values: typeof settingsForm.values) => {
            return axios.post(`${API_BASE}/groups/${group.id}`, values);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            notifications.show({ title: 'Success', message: 'Group updated', color: 'green' });
            close();
        }
    });

    const logMutation = useMutation({
        mutationFn: async (values: typeof logForm.values) => {
            // PHASE 8 PREVIEW: This endpoint doesn't exist yet, but this is how we will call it
            return axios.post(`${API_BASE}/logs/bulk`, {
                group_id: group.id,
                event_type: values.type,
                event_date: values.date.toISOString(),
                value: values.value,
                notes: values.notes
            });
        },
        onSuccess: () => {
            notifications.show({ title: 'Logged', message: 'Bulk entry recorded', color: 'green' });
            close();
        },
        onError: () => {
            notifications.show({ title: 'Pending Feature', message: 'Bulk Logging API coming in Phase 8', color: 'blue' });
        }
    });

    return (
        <Modal opened={opened} onClose={close} title={`Manage Group: ${group?.name}`} size="lg">
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="settings">Settings & Parents</Tabs.Tab>
                    <Tabs.Tab value="log">Bulk Record</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="settings" pt="md">
                    <form onSubmit={settingsForm.onSubmit((v) => settingsMutation.mutate(v))}>
                        <Stack>
                            <TextInput 
                                label="Group Name" 
                                required 
                                {...settingsForm.getInputProps('name')} 
                            />
                            
                            <Divider label="Bulk Parent Update" labelPosition="center" />
                            <Alert variant="light" color="blue" icon={<IconInfoCircle/>}>
                                Setting parents here will update <b>ALL</b> animals currently in this group.
                            </Alert>

                            <DatePickerInput 
                                label="Reference Birth Date" 
                                description="Used to validate if parents are old enough"
                                value={refDate} 
                                onChange={setRefDate}
                                mb="sm"
                            />

                            <Group grow>
                                {/*<Select 
                                    label="Set Father (Sire)" 
                                    placeholder="Search Male ID"
                                    searchable
                                    data={[]} // Populate with males
                                    {...settingsForm.getInputProps('sire_id')}
                                />
                                <Select 
                                    label="Set Mother (Dam)" 
                                    placeholder="Search Female ID"
                                    searchable
                                    data={[]} // Populate with females
                                    {...settingsForm.getInputProps('dam_id')}
                                />*/}
                                <ParentSelect 
                                    label="Set Father" 
                                    typeId={parentType.id} 
                                    gender="male" 
                                    value={settingsForm.values.sire_id}
                                    onChange={(v) => settingsForm.setFieldValue('sire_id', v)}
                                    childDob={refDate}
                                    config={parentType.farm_lifecycle}
                                />
                                <ParentSelect 
                                    label="Set Mother" 
                                    typeId={parentType.id} 
                                    gender="female" 
                                    value={settingsForm.values.dam_id}
                                    onChange={(v) => settingsForm.setFieldValue('dam_id', v)}
                                    childDob={refDate}
                                    config={parentType.farm_lifecycle}
                                />
                            </Group>

                            <Button type="submit" loading={settingsMutation.isPending} mt="md">Save Changes</Button>
                        </Stack>
                    </form>
                </Tabs.Panel>

                <Tabs.Panel value="log" pt="md">
                    <form onSubmit={logForm.onSubmit((v) => logMutation.mutate(v))}>
                        <Stack>
                            <Alert variant="light" color="green" icon={<IconInfoCircle/>}>
                                Records will be applied to every animal in this group.
                                Weights/Feed will be divided equally if configured.
                            </Alert>

                            <Group grow>
                                <Select 
                                    label="Event Type" 
                                    data={[
                                        { value: 'feed', label: 'Feed Consumption' },
                                        { value: 'weight', label: 'Bulk Weight (Total)' },
                                        { value: 'medical', label: 'Medical/Vet Practice' },
                                        { value: 'production', label: 'Production (Eggs/Milk)' }
                                    ]}
                                    {...logForm.getInputProps('type')}
                                />
                                <DatePickerInput label="Date" {...logForm.getInputProps('date')} />
                            </Group>

                            <TextInput 
                                label={
                                    logForm.values.type === 'feed' ? 'Total Feed Amount (kg)' : 
                                    logForm.values.type === 'weight' ? 'Total Group Weight (kg)' : 
                                    'Value / Amount'
                                }
                                placeholder="e.g. 50"
                                required
                                {...logForm.getInputProps('value')}
                            />

                            <TextInput 
                                label="Notes / Medicine Name" 
                                placeholder="Optional details" 
                                {...logForm.getInputProps('notes')}
                            />

                            <Button type="submit" loading={logMutation.isPending} color="green" mt="md">Record Entry</Button>
                        </Stack>
                    </form>
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
}