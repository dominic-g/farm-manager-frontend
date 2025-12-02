import { Button, Group, TextInput, NumberInput, ActionIcon, Paper, Text, Stack, Accordion } from '@mantine/core';
import { IconTrash, IconPlus, IconBowl } from '@tabler/icons-react';

export interface FeedCurveItem {
    name: string; // e.g., "Pellets"
    start_amount: number; // grams
    end_amount: number; // grams
}

export interface FeedStage {
    name: string; // e.g. "Starter"
    start_day: number;
    end_day: number;
    items: FeedCurveItem[];
}

interface Props {
    values: FeedStage[];
    onChange: (values: FeedStage[]) => void;
}

export function FeedConfig({ values, onChange }: Props) {
    
    // --- Stage Management ---
    const addStage = () => {
        onChange([...values, { name: 'New Stage', start_day: 0, end_day: 30, items: [] }]);
    };

    const removeStage = (index: number) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        onChange(newValues);
    };

    const updateStage = (index: number, field: keyof FeedStage, val: any) => {
        const newValues = [...values];
        newValues[index] = { ...newValues[index], [field]: val };
        onChange(newValues);
    };

    // --- Item (Feed Type) Management ---
    const addItem = (stageIndex: number) => {
        const newValues = [...values];
        newValues[stageIndex].items.push({ name: '', start_amount: 0, end_amount: 0 });
        onChange(newValues);
    };

    const removeItem = (stageIndex: number, itemIndex: number) => {
        const newValues = [...values];
        newValues[stageIndex].items.splice(itemIndex, 1);
        onChange(newValues);
    };

    const updateItem = (stageIndex: number, itemIndex: number, field: keyof FeedCurveItem, val: any) => {
        const newValues = [...values];
        newValues[stageIndex].items[itemIndex] = { 
            ...newValues[stageIndex].items[itemIndex], 
            [field]: val 
        };
        onChange(newValues);
    };

    return (
        <Stack>
            <Group justify="space-between">
                <Text size="sm" fw={500}>Feed Stages</Text>
                <Button variant="light" size="xs" leftSection={<IconPlus size={14}/>} onClick={addStage}>Add Stage</Button>
            </Group>

            <Accordion variant="separated">
                {values.map((stage, sIndex) => (
                    <Accordion.Item key={sIndex} value={`stage-${sIndex}`}>
                        <Accordion.Control icon={<IconBowl size={16}/>}>
                             {stage.name || "Unnamed Stage"} (Day {stage.start_day} - {stage.end_day})
                        </Accordion.Control>
                        <Accordion.Panel>
                            {/* Stage Settings */}
                            <Group mb="sm">
                                <TextInput 
                                    label="Stage Name" 
                                    placeholder="e.g. Starter" 
                                    value={stage.name} 
                                    onChange={(e) => updateStage(sIndex, 'name', e.currentTarget.value)}
                                    style={{ flex: 2 }}
                                />
                                <NumberInput 
                                    label="Start Day" 
                                    value={stage.start_day} 
                                    onChange={(v) => updateStage(sIndex, 'start_day', v)} 
                                    style={{ flex: 1 }}
                                />
                                <NumberInput 
                                    label="End Day" 
                                    value={stage.end_day} 
                                    onChange={(v) => updateStage(sIndex, 'end_day', v)} 
                                    style={{ flex: 1 }}
                                />
                                <ActionIcon color="red" variant="subtle" mt={24} onClick={() => removeStage(sIndex)}>
                                    <IconTrash size={16}/>
                                </ActionIcon>
                            </Group>

                            <Text size="xs" fw={700} mb={5}>Diet Items in this Stage</Text>
                            
                            {/* Feed Items Loop */}
                            {stage.items.map((item, iIndex) => (
                                <Group key={iIndex} mb="xs" align="flex-end">
                                    <TextInput 
                                        placeholder="Feed Name (e.g. Mash)" 
                                        value={item.name}
                                        onChange={(e) => updateItem(sIndex, iIndex, 'name', e.currentTarget.value)}
                                        style={{ flex: 2 }}
                                    />
                                    <NumberInput 
                                        placeholder="Start (g)" 
                                        label={iIndex === 0 ? "Start Grams" : undefined}
                                        value={item.start_amount}
                                        onChange={(v) => updateItem(sIndex, iIndex, 'start_amount', v)}
                                        style={{ flex: 1 }}
                                    />
                                    <NumberInput 
                                        placeholder="End (g)" 
                                        label={iIndex === 0 ? "End Grams" : undefined}
                                        value={item.end_amount}
                                        onChange={(v) => updateItem(sIndex, iIndex, 'end_amount', v)}
                                        style={{ flex: 1 }}
                                    />
                                    <ActionIcon color="red" variant="subtle" onClick={() => removeItem(sIndex, iIndex)}>
                                        <IconTrash size={14}/>
                                    </ActionIcon>
                                </Group>
                            ))}
                            
                            <Button size="xs" variant="default" fullWidth mt="xs" leftSection={<IconPlus size={12}/>} onClick={() => addItem(sIndex)}>
                                Add Feed Item
                            </Button>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        </Stack>
    );
}