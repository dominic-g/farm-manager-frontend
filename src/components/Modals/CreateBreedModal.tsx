import { useEffect } from 'react';
import { Modal, TextInput, NumberInput, Button, Group, Stack, Tabs, Alert, Text, Divider, SimpleGrid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { FeedConfig } from '../Inputs/FeedConfig';
import { HealthConfig } from '../Inputs/HealthConfig';

interface Props {
    opened: boolean;
    close: () => void;
    parentType: any; // The Animal Type object (Rabbit)
    editId: number | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function CreateBreedModal({ opened, close, parentType, editId }: Props) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const form = useForm({
        initialValues: {
            title: '',
            // Lifecycle defaults
            gestation_days: 0,
            weaning_days: 0,
            meat_production_age: 0,
            sexual_maturity_female: 0,
            sexual_maturity_male: 0,
            // Arrays
            farm_feed: [],
            farm_health: []
        },
    });

    // AUTO-FILL / INHERITANCE LOGIC
    useEffect(() => {
        if (opened && parentType) {
            // Unpack parent lifecycle
            const lc = parentType.farm_lifecycle || {};
            const mat = lc.maturity || {};

            // If we are creating (not editing), copy Parent values as defaults
            if (!editId) {
                form.setValues({
                    title: '',
                    gestation_days: lc.gestation || 0,
                    weaning_days: lc.weaning_complete || 0,
                    meat_production_age: lc.meat_age || 0,
                    sexual_maturity_female: mat.female || 0,
                    sexual_maturity_male: mat.male || 0,
                    
                    // Copy arrays so user can modify them for the breed
                    farm_feed: parentType.farm_feed || [],
                    farm_health: parentType.farm_health || []
                });
            }
        }
    }, [opened, parentType, editId]);

    // FETCH EXISTING IF EDITING
    // (Logic omitted for brevity - similar to Type Modal, ask if you need it)

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            // Reconstruct Lifecycle Object
            const lifecycle = {
                // Keep parent type logic (birth vs hatch)
                type: parentType.farm_lifecycle?.type || 'birth', 
                maturity: { male: values.sexual_maturity_male, female: values.sexual_maturity_female },
                meat_age: values.meat_production_age,
                // Add specific fields based on parent type...
                gestation: values.gestation_days,
                weaning_complete: values.weaning_days,
                // ... (add other fields mapped from form)
            };

            const payload = {
                title: values.title,
                status: 'publish',
                farm_parent_type: parentType.id, // LINK TO PARENT
                farm_lifecycle: lifecycle,
                farm_feed: values.farm_feed,
                farm_health: values.farm_health
            };

            return axios.post(`${API_BASE}/farm_breed`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['breeds'] });
            notifications.show({ title: 'Success', message: 'Breed Saved', color: 'green' });
            close();
            form.reset();
        },
        onError: (err: any) => {
            notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
        }
    });

    return (
        <Modal opened={opened} onClose={close} title={isEdit ? "Edit Breed" : `Add ${parentType?.title.rendered} Breed`} size="xl">
            <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
                <Tabs defaultValue="basic">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="basic">Basic</Tabs.Tab>
                        <Tabs.Tab value="feed">Feed</Tabs.Tab>
                        <Tabs.Tab value="health">Health</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="basic">
                        <Stack>
                            <Alert icon={<IconInfoCircle />} variant="light" color="blue">
                                Values are pre-filled from the <b>{parentType?.title.rendered}</b> category. 
                                Change them only if this breed is different.
                            </Alert>
                            
                            <TextInput label="Breed Name" placeholder="e.g. Californian White" required {...form.getInputProps('title')} />
                            
                            <Divider label="Growth & Lifecycle Overrides" labelPosition="center" />
                            
                            <SimpleGrid cols={2}>
                                <NumberInput label="Meat Age (Days)" {...form.getInputProps('meat_production_age')} />
                                <NumberInput label="Weaning (Days)" {...form.getInputProps('weaning_days')} />
                                <NumberInput label="Maturity Male (Days)" {...form.getInputProps('sexual_maturity_male')} />
                                <NumberInput label="Maturity Female (Days)" {...form.getInputProps('sexual_maturity_female')} />
                            </SimpleGrid>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="feed">
                        <FeedConfig values={form.values.farm_feed} onChange={(v) => form.setFieldValue('farm_feed', v)} />
                    </Tabs.Panel>

                    <Tabs.Panel value="health">
                        <HealthConfig values={form.values.farm_health} onChange={(v) => form.setFieldValue('farm_health', v)} />
                    </Tabs.Panel>
                </Tabs>

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={close}>Cancel</Button>
                    <Button type="submit" loading={mutation.isPending}>Save Breed</Button>
                </Group>
            </form>
        </Modal>
    );
}