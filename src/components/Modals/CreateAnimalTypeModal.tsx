import { Modal, TextInput, Select, NumberInput, Button, Group, Stack, Text, Divider, SimpleGrid, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconGridSelector } from '../Inputs/IconGridSelector';
import { HealthConfig } from '../Inputs/HealthConfig';
import type { HealthEvent } from '../Inputs/HealthConfig';
import { FeedConfig } from '../Inputs/FeedConfig';
import type { FeedStage } from '../Inputs/FeedConfig';

interface Props {
    opened: boolean;
    close: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function CreateAnimalTypeModal({ opened, close }: Props) {
    const queryClient = useQueryClient();

    const form = useForm({
        initialValues: {
            title: '',
            icon: 'paw',
            reproductionType: 'birth', // 'birth' or 'hatching'
            
            // --- Shared Fields ---
            sexual_maturity_male: 120,
            sexual_maturity_female: 120,
            meat_production_age: 150,

            // --- Birth Specifics (Mammals) ---
            gestation_days: 30,
            solid_food_start_days: 20, 
            weaning_days: 42, 
            milking_end_days: 0,
            serving_age: 120, // Age they reach serving age (breeding)

            // --- Hatching Specifics (Birds) ---
            incubation_days: 21,
            brooder_days: 30,
            brooder_temp: 35, // Degrees Celsius
            brooder_humidity: 60, // Percentage
            age_to_start_laying: 140, // Female
            age_to_reach_laying_peak: 180, // Female

            // --- ADVANCED FIELDS ---
            farm_health: [] as HealthEvent[],
            farm_feed: [] as FeedStage[]
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            
            // Build the lifecycle object based STRICTLY on type
            let lifecycle: any = {
                type: values.reproductionType,
                maturity: {
                    male: values.sexual_maturity_male,
                    female: values.sexual_maturity_female
                },
                meat_age: values.meat_production_age
            };

            if (values.reproductionType === 'birth') {
                // MAMMALS
                lifecycle = {
                    ...lifecycle,
                    gestation: values.gestation_days,
                    solid_food_start: values.solid_food_start_days,
                    weaning_complete: values.weaning_days,
                    milking_duration: values.milking_end_days,
                    serving_age: values.serving_age
                };
            } else {
                // BIRDS / HATCHING
                lifecycle = {
                    ...lifecycle,
                    incubation: values.incubation_days,
                    brooder_duration: values.brooder_days,
                    brooder_temp: values.brooder_temp,
                    brooder_humidity: values.brooder_humidity,
                    laying_start: values.age_to_start_laying,
                    laying_peak: values.age_to_reach_laying_peak
                };
            }

            return axios.post(`${API_BASE}/farm_type`, {
                title: values.title,
                status: 'publish',
                farm_icon: values.icon,
                farm_lifecycle: lifecycle,
                // Advanced fields (Feed/Health)

                farm_health: values.farm_health,
                farm_feed: values.farm_feed
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['animalTypes'] });
            notifications.show({ title: 'Success', message: 'Configuration Saved', color: 'green' });
            close();
            form.reset();
        },
        onError: () => {
            notifications.show({ title: 'Error', message: 'Save failed', color: 'red' });
        }
    });

    return (
        <Modal opened={opened} onClose={close} title="Add New Animal Type" size="xl">
            <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
                <Tabs defaultValue="basic">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="basic">Basic Info</Tabs.Tab>
                        <Tabs.Tab value="lifecycle">Lifecycle</Tabs.Tab>
                        <Tabs.Tab value="feed">Feed Schedule</Tabs.Tab>
                        <Tabs.Tab value="health">Health & Vet</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="basic">
                        <Stack gap="md">
                            <TextInput label="Animal Name" placeholder="e.g. Rabbits" required {...form.getInputProps('title')} />
                            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" verticalSpacing="md">
            
                                <IconGridSelector 
                                    label="Category Icon" 
                                    value={form.values.icon}
                                    onChange={(val) => form.setFieldValue('icon', val)}
                                />

                                {/* Right Column: Reproduction Select */}
                                {/* We useing a Stack to align it visually with the label of the grid */}
                                <Stack gap={5}> 
                                    <Select
                                        label="Reproduction Method"
                                        data={[
                                            { value: 'birth', label: 'Mammal (Birth)' },
                                            { value: 'hatching', label: 'Bird (Hatch)' }
                                        ]}
                                        {...form.getInputProps('reproductionType')}
                                    />
                                    <Text size="xs" c="dimmed">
                                        Determines the lifecycle fields (Gestation vs Incubation).
                                    </Text>
                                </Stack>
                                
                            </SimpleGrid>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="lifecycle">
                        <Stack gap="md">
                            {/* Insert the conditional Lifecycle inputs here (Same as previous message) */}
                            {form.values.reproductionType === 'birth' ? (
                                <SimpleGrid cols={2}>
                                    <NumberInput label="Gestation" {...form.getInputProps('gestation_days')} />
                                    <NumberInput label="Weaning" {...form.getInputProps('weaning_days')} />
                                    {/* Add others... */}
                                </SimpleGrid>
                            ) : (
                                <SimpleGrid cols={2}>
                                    <NumberInput label="Incubation" {...form.getInputProps('incubation_days')} />
                                    <NumberInput label="Brooder Days" {...form.getInputProps('brooder_days')} />
                                    {/* Add others... */}
                                </SimpleGrid>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="feed">
                        {/* New Feed Component */}
                        <FeedConfig 
                            values={form.values.farm_feed} 
                            onChange={(val) => form.setFieldValue('farm_feed', val)} 
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="health">
                        {/* New Health Component */}
                        <HealthConfig 
                            values={form.values.farm_health} 
                            onChange={(val) => form.setFieldValue('farm_health', val)} 
                        />
                    </Tabs.Panel>
                </Tabs>

                <Group mt="xl" justify="flex-end">
                    <Button variant="default" onClick={close}>Cancel</Button>
                    <Button type="submit" loading={mutation.isPending}>Save Configuration</Button>
                </Group>
            </form>
        </Modal>
    );
}