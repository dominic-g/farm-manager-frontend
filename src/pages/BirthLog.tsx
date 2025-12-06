import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Table, Paper, Group, Text, Badge, Button, LoadingOverlay, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { IconArrowLeft } from '@tabler/icons-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function BirthLog() {
    const { id } = useParams(); // Log ID
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['birth', id],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/birth/${id}`);
            return res.data;
        }
    });

    if (isLoading) return <LoadingOverlay visible={true} />;

    return (
        <Container fluid>
            <Button variant="subtle" onClick={() => navigate(-1)} leftSection={<IconArrowLeft/>}>Back</Button>
            
            <Title order={2} mb="lg">Birth Record #{id}</Title>

            <Paper p="md" withBorder mb="lg">
                <Group justify="space-between">
                    <Stack gap={0}>
                        <Text c="dimmed" size="xs">Date</Text>
                        <Text fw={700}>{new Date(data.date).toLocaleDateString()}</Text>
                    </Stack>
                    <Stack gap={0}>
                        <Text c="dimmed" size="xs">Mother</Text>
                        <Text fw={700} c="pink">{data.mother.tag}</Text>
                    </Stack>
                    <Stack gap={0}>
                        <Text c="dimmed" size="xs">Father</Text>
                        <Text fw={700} c="blue">{data.father?.tag || 'Unknown'}</Text>
                    </Stack>
                    <Stack gap={0}>
                        <Text c="dimmed" size="xs">Survival Rate</Text>
                        <Badge color={data.alive_count === data.total_born ? 'green' : 'orange'}>
                            {data.alive_count} / {data.total_born} Alive
                        </Badge>
                    </Stack>
                </Group>
            </Paper>

            <Title order={4} mb="sm">Offspring</Title>
            <Paper withBorder>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Tag</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Action</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.children.map((child: any) => (
                            <Table.Tr key={child.ID}>
                                <Table.Td fw={700}>{child.post_title}</Table.Td>
                                <Table.Td>
                                    <Badge color={child.status === 'active' ? 'green' : 'red'}>{child.status}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Button size="xs" variant="light" onClick={() => navigate(`/animal/view/${child.ID}`)}>View Profile</Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Container>
    );
}