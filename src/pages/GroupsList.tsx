import { useState } from 'react';
import { Container, Title, Group, Table, Paper, ActionIcon, TextInput, Text, LoadingOverlay, Pagination } from '@mantine/core';
import { IconTrash, IconEdit, IconSearch } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { useGroups } from '../hooks/useGroups';
import type { FarmGroup } from '../hooks/useGroups'; // Ensure correct import
import { notifications } from '@mantine/notifications';
import { GroupActionModal } from '../components/Modals/GroupActionModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function GroupsList() {
    const { slug } = useParams();
    
    // FIX: Extract data
    const { data: typeData } = useAnimalTypes(1, 100);
    const types = typeData?.data || [];
    const currentType = types.find(t => t.slug === slug);
    
    const [page, setPage] = useState(1);
    
    // FIX: Extract data
    const { data: groupData, isLoading } = useGroups(currentType?.id, page);
    const groups = groupData?.data || [];
    const totalPages = groupData?.totalPages || 1;

    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<FarmGroup | null>(null);

    const filteredGroups = groups.filter((g: any) => g.name.toLowerCase().includes(search.toLowerCase()));

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
                        {filteredGroups.map((group: any) => (
                            <Table.Tr key={group.id}>
                                <Table.Td fw={500}>{group.name}</Table.Td>
                                <Table.Td><Text size="sm" c="dimmed">-</Text></Table.Td>
                                <Table.Td>
                                    <Group justify="flex-end" gap="xs">
                                        <ActionIcon variant="subtle" color="blue" onClick={() => setSelectedGroup(group)}>
                                            <IconEdit size={16}/>
                                        </ActionIcon>
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

            {selectedGroup && (
                <GroupActionModal 
                    opened={!!selectedGroup} 
                    close={() => setSelectedGroup(null)} 
                    group={selectedGroup} 
                    typeId={currentType.id}
                    parentType={currentType}
                />
            )}

            {totalPages > 1 && (
                <Group justify="center" mt="lg">
                    <Pagination total={totalPages} value={page} onChange={setPage} />
                </Group>
            )}
        </Container>
    );
}