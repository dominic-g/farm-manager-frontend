import { useState } from 'react';
import { TextInput, SimpleGrid, ActionIcon, Paper, ScrollArea, Tooltip, Text, Stack } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { getIconComponent, iconSelectData } from '../../utils/iconMap';

interface Props {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export function IconGridSelector({ value, onChange, label }: Props) {
    const [search, setSearch] = useState('');

    // Filter icons based on search
    const filteredIcons = iconSelectData.filter(item => 
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Stack gap={5}>
            {label && <Text size="sm" fw={500}>{label}</Text>}
            
            <Paper withBorder p="xs" radius="sm">
                <TextInput 
                    placeholder="Search icons..." 
                    leftSection={<IconSearch size={14}/>}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    size="xs"
                    mb="xs"
                />
                
                <ScrollArea h={120} type="always" offsetScrollbars>
                    <SimpleGrid cols={{ base: 6, sm: 8, md: 10 }} spacing="xs" verticalSpacing="xs">
                        {filteredIcons.map((item) => {
                            const Icon = getIconComponent(item.value);
                            const isSelected = value === item.value;
                            
                            return (
                                <Tooltip label={item.label} key={item.value} openDelay={500}>
                                    <ActionIcon 
                                        variant={isSelected ? 'filled' : 'subtle'} 
                                        color={isSelected ? 'blue' : 'gray'}
                                        size="lg"
                                        onClick={() => onChange(item.value)}
                                        aria-label={item.label}
                                    >
                                        <Icon size={20} />
                                    </ActionIcon>
                                </Tooltip>
                            );
                        })}
                    </SimpleGrid>
                    
                    {filteredIcons.length === 0 && (
                        <Text c="dimmed" size="xs" ta="center" mt="sm">No icons found</Text>
                    )}
                </ScrollArea>
            </Paper>
        </Stack>
    );
}