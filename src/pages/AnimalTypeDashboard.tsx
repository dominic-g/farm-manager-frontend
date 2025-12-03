import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, Grid, Paper, Title, Group, Text, SimpleGrid, Button, ActionIcon, 
    Modal, Alert, Stack, LoadingOverlay 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AreaChart } from '@mantine/charts';
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { useSettings } from '../context/SettingsContext';
import { NotFound } from './NotFound'; // Import 404 Page

import '@mantine/dates/styles.css';

interface Props {
    openEditModal: (id: number) => void;
}

export function AnimalTypeDashboard({ openEditModal }: Props) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { formatCurrency, formatWeight } = useSettings();
    
    const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

    const { data: types } = useAnimalTypes();
    const currentType = types?.find(t => t.slug === slug);
    const typeId = currentType?.id;

    const dashboardTitle = currentType 
        ? `${currentType.title.rendered || currentType.title.raw}'s Dashboard` 
        : 'Loading...';

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        new Date(new Date().setDate(new Date().getDate() - 30)),
        new Date()
    ]);

    // Fetch Stats
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['typeStats', slug, dateRange],
        queryFn: async () => {
            if (!dateRange[0] || !dateRange[1]) return null;
            const start = dateRange[0].toISOString().split('T')[0];
            const end = dateRange[1].toISOString().split('T')[0];
            
            const rootApi = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '');
            const res = await axios.get(`${rootApi}/farm/v1/stats/type/${slug}?start_date=${start}&end_date=${end}`);
            return res.data;
        },
        enabled: !!slug && !!dateRange[0] && !!dateRange[1],
        retry: false // Don't retry if 404
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const rootApi = import.meta.env.VITE_API_BASE_URL;
            return axios.delete(`${rootApi}/farm_type/${typeId}?force=true`);
        },
        onSuccess: () => {
            notifications.show({ title: 'Deleted', message: 'Category removed.', color: 'red' });
            queryClient.invalidateQueries({ queryKey: ['animalTypes'] });
            navigate('/types');
        },
        onError: (err: any) => {
            notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
            closeDelete();
        }
    });

    // --- 1. HANDLE 404 / ERRORS ---
    if (isError) {
        // If the error status is 404, show NotFound page
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return <NotFound />;
        }
        return <Alert color="red" title="Error">Could not load dashboard</Alert>;
    }

    if (isLoading) return <LoadingOverlay visible={true} />;

    // Transform Data
    const activeCount = data?.population?.find((p:any) => p.status === 'active')?.count || 0;
    const soldCount = data?.population?.find((p:any) => p.status === 'sold')?.count || 0;
    const deadCount = data?.population?.find((p:any) => p.status === 'dead')?.count || 0;
    const slaughterCount = data?.population?.find((p:any) => p.status === 'slaughtered')?.count || 0; // New

    const statsCards = [
        { title: 'Active Animals', icon: 'paw', value: activeCount, diff: 0 },
        { title: 'Feed Consumed', icon: 'scale', value: formatWeight(data?.feed?.total_kg || 0), diff: 0 },
        { title: 'Feed Cost', icon: 'coin', value: formatCurrency(data?.feed?.total_cost || 0), diff: 0 },
        { title: 'Total Sold', icon: 'receipt', value: soldCount, diff: 0 },
    ];

    const chartData = data?.production?.reduce((acc: any[], curr: any) => {
        const existing = acc.find(item => item.date === curr.date);
        if (existing) {
            existing[curr.event_type] = curr.total;
        } else {
            acc.push({ date: curr.date, [curr.event_type]: curr.total });
        }
        return acc;
    }, []) || [];

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <Title order={2}>{dashboardTitle}</Title>
                <Group gap="xs">
                    <DatePickerInput
                        type="range"
                        placeholder="Pick date range"
                        value={dateRange}
                        onChange={setDateRange}
                        w={200}
                        valueFormat="D MMM 'YY" 
                        numberOfColumns={1}
                    />
                    <Button 
                        leftSection={<IconEdit size={16} />} 
                        variant="light" 
                        onClick={() => typeId && openEditModal(typeId)}
                        visibleFrom="xs"
                    >
                        Edit
                    </Button>
                    <ActionIcon 
                        variant="light" size="lg" hiddenFrom="xs"
                        onClick={() => typeId && openEditModal(typeId)}
                    >
                        <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon 
                        variant="filled" color="red" size="lg" onClick={openDelete}
                    >
                        <IconTrash size={18} />
                    </ActionIcon>
                </Group>
            </Group>

            <StatsGrid data={statsCards as any} />

            <Grid mt="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper withBorder p="md" radius="md">
                        <Text fw={700} mb="md">Production Overview</Text>
                        {chartData.length > 0 ? (
                            <AreaChart
                                h={300}
                                data={chartData}
                                dataKey="date"
                                series={[
                                    { name: 'produce_egg', color: 'yellow.6', label: 'Eggs' },
                                    { name: 'produce_milk', color: 'blue.6', label: 'Milk (L)' },
                                    { name: 'produce_meat', color: 'red.6', label: 'Meat (kg)' },
                                ]}
                                curveType="monotone"
                            />
                        ) : (
                            <Group h={200} align="center" justify="center">
                                <Text c="dimmed">No production data for this period</Text>
                            </Group>
                        )}
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Title order={4} mb="md">Population Health</Title>
                        
                        {/* 2. Added New Squares for Sold & Slaughtered */}
                        <SimpleGrid cols={2} spacing="xs">
                            <Paper bg="green.1" p="xs" radius="md">
                                <Text size="xs" c="green.9">Active</Text>
                                <Text size="xl" fw={700} c="green.9">{activeCount}</Text>
                            </Paper>
                            <Paper bg="red.1" p="xs" radius="md">
                                <Text size="xs" c="red.9">Deaths</Text>
                                <Text size="xl" fw={700} c="red.9">{deadCount}</Text>
                            </Paper>
                            <Paper bg="blue.1" p="xs" radius="md">
                                <Text size="xs" c="blue.9">Sold</Text>
                                <Text size="xl" fw={700} c="blue.9">{soldCount}</Text>
                            </Paper>
                            <Paper bg="gray.1" p="xs" radius="md">
                                <Text size="xs" c="gray.9">Slaughtered</Text>
                                <Text size="xl" fw={700} c="gray.9">{slaughterCount}</Text>
                            </Paper>
                        </SimpleGrid>
                        
                        <Title order={4} mt="xl" mb="md">Financials</Title>
                        <Group justify="space-between" mb="xs">
                            <Text size="sm">Income</Text>
                            <Text fw={700} c="teal">
                                {/* 3. Apply Currency Formatting */}
                                {formatCurrency(data?.finance?.find((f:any)=>f.type==='income')?.total || 0)}
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm">Expenses</Text>
                            <Text fw={700} c="red">
                                {/* 3. Apply Currency Formatting */}
                                {formatCurrency(data?.finance?.find((f:any)=>f.type==='expense')?.total || 0)}
                            </Text>
                        </Group>
                    </Paper>
                </Grid.Col>
            </Grid>

            <Modal opened={deleteOpened} onClose={closeDelete} title="Delete Animal Category" centered>
                <Stack>
                    <Alert variant="light" color="red" icon={<IconAlertCircle />}>
                        Warning: This action is destructive and cannot be undone.
                    </Alert>
                    <Text size="sm">
                        Are you sure you want to delete <strong>{currentType?.title.rendered}</strong>?
                    </Text>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeDelete}>Cancel</Button>
                        <Button color="red" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>
                            Delete Everything
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}