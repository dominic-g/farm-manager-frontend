import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Title, Stack, Group, Text, Table, Badge, Tabs, Pagination, Button, Modal, TextInput, NumberInput, ActionIcon, Alert, LoadingOverlay } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { IconArrowLeft, IconEdit, IconAlertCircle } from '@tabler/icons-react';
import { PieChart, AreaChart } from '@mantine/charts';
import { useSettings } from '../context/SettingsContext';
import { NotFound } from './NotFound';
import { notifications } from '@mantine/notifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function ResourceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { formatCurrency, settings } = useSettings();
    const queryClient = useQueryClient();
    
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<string | null>('usage');
    
    // Correction State
    const [correctModal, setCorrectModal] = useState<{ open: boolean, log: any | null }>({ open: false, log: null });
    const [correctVal, setCorrectVal] = useState<number | ''>('');
    const [correctReason, setCorrectReason] = useState('');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['resource', id, page],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/resources/${id}?page=${page}`);
            return res.data;
        },
        retry: false
    });

    const correctMutation = useMutation({
        mutationFn: async () => {
            return axios.post(`${API_BASE}/logs/correct`, {
                log_id: correctModal.log?.id,
                correct_value: correctVal,
                reason: correctReason
            });
        },
        onSuccess: () => {
            notifications.show({ title: 'Corrected', message: 'Inventory and Logs updated', color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['resource'] });
            setCorrectModal({ open: false, log: null });
        }
    });

    if (isLoading) return <LoadingOverlay visible={true} />;
    if (isError || !data?.info) return <NotFound />;

    const { info, stats, usage, restocks } = data;

    // Charts Data
    const pieData = [
        { name: 'Remaining', value: Number(stats.current), color: 'teal.6' },
        { name: 'Used', value: Number(stats.used), color: 'gray.4' }
    ];

    return (
        <Container fluid>
            <Button variant="subtle" size="xs" leftSection={<IconArrowLeft/>} onClick={() => navigate('/resources')} mb="md">
                Back to Inventory
            </Button>

            <Group justify="space-between" mb="lg">
                <Title order={2}>{info.name}</Title>
                <Button variant="light" leftSection={<IconEdit size={16}/>}>Edit Details</Button>
            </Group>

            {/* ANALYTICS SECTION */}
            <Grid mb="xl">
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Text fw={700} mb="md">Stock Overview</Text>
                        <Group justify="center">
                            <PieChart 
                                size={160} 
                                data={pieData} 
                                withTooltip 
                                tooltipDataSource="segment" 
                            />
                        </Group>
                        <Group justify="center" mt="md" gap="xl">
                            <Stack gap={0} align="center">
                                <Text size="xs" c="dimmed">Available</Text>
                                <Text fw={700} size="xl" c="teal">{stats.current} {info.unit}</Text>
                            </Stack>
                            <Stack gap={0} align="center">
                                <Text size="xs" c="dimmed">Consumed</Text>
                                <Text fw={700} size="xl">{stats.used} {info.unit}</Text>
                            </Stack>
                        </Group>
                    </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Text fw={700} mb="md">Usage History (Graph Placeholder)</Text>
                        {/* Phase 9b: Add AreaChart here grouping usage logs by date */}
                        <Group h={200} bg="gray.0" justify="center"><Text c="dimmed">Usage Trend Graph</Text></Group>
                    </Paper>
                </Grid.Col>
            </Grid>

            {/* LISTS SECTION */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="usage">Usage Logs</Tabs.Tab>
                    <Tabs.Tab value="restock">Restock History</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="usage" pt="md">
                    <Paper withBorder radius="md">
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Date</Table.Th>
                                    <Table.Th>Target</Table.Th>
                                    <Table.Th>Amount</Table.Th>
                                    <Table.Th>Action</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {usage.data.map((log: any) => {
                                    // Identify if it's a correction log (negative value)
                                    const isCorrection = Number(log.value_primary) < 0;
                                    return (
                                        <Table.Tr key={log.id} bg={isCorrection ? 'red.0' : undefined}>
                                            <Table.Td>{new Date(log.event_date).toLocaleString()}</Table.Td>
                                            <Table.Td>
                                                {/* In a real app, fetch animal tag via ID or return name in API */}
                                                <Button 
                                                    variant="subtle" size="compact-xs" 
                                                    onClick={() => navigate(`/animal/view/${log.animal_id}`)} // Use ID route or slug if avail
                                                >
                                                    Animal #{log.animal_id}
                                                </Button>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text c={isCorrection ? 'red' : 'dark'} fw={500}>
                                                    {log.value_primary} {info.unit}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                {!isCorrection && (
                                                    <Button 
                                                        size="compact-xs" variant="light" color="orange"
                                                        onClick={() => {
                                                            setCorrectVal(Number(log.value_primary)); // Pre-fill
                                                            setCorrectModal({ open: true, log });
                                                        }}
                                                    >
                                                        Correct Error
                                                    </Button>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                    <Group justify="center" mt="md">
                        <Pagination total={usage.pages} value={page} onChange={setPage} />
                    </Group>
                </Tabs.Panel>

                <Tabs.Panel value="restock" pt="md">
                    <Paper withBorder radius="md">
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Date</Table.Th>
                                    <Table.Th>Description</Table.Th>
                                    <Table.Th>Cost</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {restocks.map((r: any) => (
                                    <Table.Tr key={r.id}>
                                        <Table.Td>{new Date(r.date_transaction).toLocaleDateString()}</Table.Td>
                                        <Table.Td>{r.description}</Table.Td>
                                        <Table.Td c="red" fw={500}>{formatCurrency(r.amount)}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Tabs.Panel>
            </Tabs>

            {/* CORRECTION MODAL */}
            <Modal 
                opened={correctModal.open} 
                onClose={() => setCorrectModal({ open: false, log: null })}
                title="Correct Inventory Record"
            >
                <Alert icon={<IconAlertCircle/>} color="orange" mb="md">
                    This will create a counter-entry to adjust inventory and animal records. The original record remains for audit purposes.
                </Alert>
                <Stack>
                    <Text size="sm">Original Entry: <b>{correctModal.log?.value_primary} {info.unit}</b></Text>
                    
                    <NumberInput 
                        label={`Correct Actual Amount (${info.unit})`}
                        description="What SHOULD it have been?"
                        value={correctVal}
                        onChange={setCorrectVal}
                    />
                    <TextInput 
                        label="Reason"
                        placeholder="e.g. Typo, Scale error"
                        required
                        value={correctReason}
                        onChange={(e) => setCorrectReason(e.currentTarget.value)}
                    />
                    <Button color="orange" onClick={() => correctMutation.mutate()} loading={correctMutation.isPending}>
                        Apply Correction
                    </Button>
                </Stack>
            </Modal>
        </Container>
    );
}