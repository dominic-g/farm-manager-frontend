import { useState } from 'react';
import { Container, Title, Group, Table, Paper, ActionIcon, TextInput, Text, LoadingOverlay } from '@mantine/core';
import { IconTrash, IconEdit, IconSearch } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { useGroups } from '../hooks/useGroups';
import type { FarmGroup } from '../hooks/useGroups';
import { notifications } from '@mantine/notifications';
import { GroupActionModal } from '../components/Modals/GroupActionModal'; // Import the new modal

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function GroupsList() {
    const { slug } = useParams();
    const { data: types } = useAnimalTypes();
    const currentType = types?.find(t => t.slug === slug);
    
    const { data: groups, isLoading } = useGroups(currentType?.id);
    const queryClient = useQueryClient();

    // Local State
    const [search, setSearch] = useState('');
    
    // We only need ONE state object now to track which group is being managed
    const [selectedGroup, setSelectedGroup] = useState<FarmGroup | null>(null);

    // Filter Logic
    const filteredGroups = Array.isArray(groups) 
        ? groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())) 
        : [];

    // Delete Mutation (Still needed here as it happens on the list)
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return axios.delete(`${API_BASE}/groups/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            notifications.show({ title: 'Deleted', message: 'Group removed', color: 'red' });
        }
    });
    const rawTitle = currentType?.title.rendered || 'Animal';
    const title = rawTitle.endsWith('s') ? `${rawTitle}' Groups` : `${rawTitle}'s Groups`;

    if (!currentType) return null;

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <Title order={3}>{title}</Title>
                <TextInput 
                    placeholder="Search groups..." 
                    leftSection={<IconSearch size={16}/>}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                />
            </Group>

            <Paper withBorder radius="md">
                <LoadingOverlay visible={isLoading} />
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Group Name</Table.Th>
                            <Table.Th>Animals Count</Table.Th> 
                            <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredGroups.map(group => (
                            <Table.Tr key={group.id}>
                                <Table.Td fw={500}>{group.name}</Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">-</Text> 
                                </Table.Td>
                                <Table.Td>
                                    <Group justify="flex-end" gap="xs">
                                        {/* EDIT BUTTON: Opens the new Modal */}
                                        <ActionIcon variant="subtle" color="blue" onClick={() => setSelectedGroup(group)}>
                                            <IconEdit size={16}/>
                                        </ActionIcon>
                                        
                                        {/* DELETE BUTTON: Stays here */}
                                        <ActionIcon variant="subtle" color="red" onClick={() => {
                                            if(confirm('Delete this group?')) deleteMutation.mutate(group.id);
                                        }}>
                                            <IconTrash size={16}/>
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>

            {/* The New Modal handles the Editing Logic internally */}
            {selectedGroup && (
                <GroupActionModal 
                    opened={!!selectedGroup} 
                    close={() => setSelectedGroup(null)} 
                    group={selectedGroup} 
                    typeId={currentType.id}
                    parentType={currentType}
                />
            )}
        </Container>
    );
}