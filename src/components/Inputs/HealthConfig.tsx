import { Button, Group, TextInput, NumberInput, Select, ActionIcon, Paper, Text, Stack } from '@mantine/core';
import { IconTrash, IconPlus, IconVaccine } from '@tabler/icons-react';

export interface HealthEvent {
    name: string;
    days: number; // Days after birth/hatch
    type: 'vaccine' | 'practice' | 'medication';
    method?: string; // e.g. "Drinking Water", "Injection"
    recurring?: boolean;
}

interface Props {
    values: HealthEvent[];
    onChange: (values: HealthEvent[]) => void;
}

export function HealthConfig({ values, onChange }: Props) {
    const addEvent = () => {
        onChange([...values, { name: '', days: 1, type: 'vaccine', method: '' }]);
    };

    const removeEvent = (index: number) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        onChange(newValues);
    };

    const updateEvent = (index: number, field: keyof HealthEvent, val: any) => {
        const newValues = [...values];
        newValues[index] = { ...newValues[index], [field]: val };
        onChange(newValues);
    };

    return (
        <Stack>
            <Group justify="space-between">
                <Text size="sm" fw={500}>Scheduled Events ({values.length})</Text>
                <Button variant="light" size="xs" leftSection={<IconPlus size={14}/>} onClick={addEvent}>Add Event</Button>
            </Group>

            {values.length === 0 && <Text c="dimmed" size="xs">No health events scheduled.</Text>}

            {values.map((item, index) => (
                <Paper key={index} withBorder p="xs" radius="sm">
                    <Group align="flex-start">
                        <ThemeIcon variant="light" color={item.type === 'vaccine' ? 'blue' : 'orange'}>
                            <IconVaccine size={16} />
                        </ThemeIcon>
                        
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Group grow>
                                <TextInput 
                                    placeholder="Event Name (e.g. Gumboro)" 
                                    value={item.name} 
                                    onChange={(e) => updateEvent(index, 'name', e.currentTarget.value)} 
                                />
                                <NumberInput 
                                    placeholder="Day Due" 
                                    min={0} 
                                    value={item.days} 
                                    onChange={(val) => updateEvent(index, 'days', val)} 
                                />
                            </Group>
                            <Group grow>
                                <Select 
                                    placeholder="Type" 
                                    data={['vaccine', 'practice', 'medication']}
                                    value={item.type}
                                    onChange={(val) => updateEvent(index, 'type', val)}
                                />
                                <TextInput 
                                    placeholder="Method (e.g. Eye Drop)" 
                                    value={item.method} 
                                    onChange={(e) => updateEvent(index, 'method', e.currentTarget.value)} 
                                />
                            </Group>
                        </Stack>

                        <ActionIcon color="red" variant="subtle" onClick={() => removeEvent(index)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Group>
                </Paper>
            ))}
        </Stack>
    );
}
import { ThemeIcon } from '@mantine/core';