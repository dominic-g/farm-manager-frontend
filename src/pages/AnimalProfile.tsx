import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Title, Group, Text, Badge, Stack, LoadingOverlay, ThemeIcon, Button, SimpleGrid } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AreaChart, BarChart, LineChart } from '@mantine/charts';
import { IconScale, IconBowl, IconCoin, IconGenderMale, IconGenderFemale, IconDna, IconCalendarEvent } from '@tabler/icons-react';
import { NotFound } from './NotFound';
import { WeightBattery } from '../components/Visuals/WeightBattery';
import { useSettings } from '../context/SettingsContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function AnimalProfile() {
    const { typeSlug, tag } = useParams();
    const navigate = useNavigate();
    const { formatWeight, formatCurrency, settings } = useSettings();

    const { data: animal, isLoading, isError } = useQuery({
        queryKey: ['animal', typeSlug, tag],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/animal/details`, {
                params: { type: typeSlug, tag: tag }
            });
            return res.data;
        },
        retry: false
    });

    if (isLoading) return <LoadingOverlay visible={true} />;
    if (isError || !animal) return <NotFound />;

    // DATA TRANSFORMATION FOR CHARTS
    
    // Weight & Feed (Combined or Separate)
    const weightData = animal.history.weight.map((log: any) => ({
        date: new Date(log.date).toLocaleDateString(),
        weight: Number(log.val)
    }));

    const feedData = animal.history.feed.map((log: any) => ({
        date: new Date(log.date).toLocaleDateString(),
        amount: Number(log.val), // kg
        cost: Number(log.cost)
    }));

    // Production (Grouping by type)
    const productionData = animal.history.production.map((log: any) => ({
        date: new Date(log.date).toLocaleDateString(),
        [log.subtype]: Number(log.val) // e.g. { milk: 5 }
    }));

    // Finance Summary
    const incomeTotal = animal.financials.filter((f:any) => f.type === 'income').reduce((a:any, b:any) => a + Number(b.amount), 0);
    const expenseTotal = animal.financials.filter((f:any) => f.type === 'expense').reduce((a:any, b:any) => a + Number(b.amount), 0);

    return (
        <Container fluid>
            {/* HEADER: ID & Parents */}
            <Group justify="space-between" align="flex-start" mb="lg">
                <Stack gap={5}>
                    <Group>
                        <Title order={2}>#{animal.tag}</Title>
                        <Badge 
                            size="lg" 
                            color={animal.gender === 'male' ? 'blue' : 'pink'}
                            leftSection={animal.gender === 'male' ? <IconGenderMale size={14}/> : <IconGenderFemale size={14}/>}
                        >
                            {animal.gender}
                        </Badge>
                    </Group>
                    <Text c="dimmed" size="sm">
                        DOB: {animal.dob || 'Unknown'} ({animal.age_days} days old)
                    </Text>
                    
                    {/* Breeds & Groups */}
                    <Group gap={5}>
                        {animal.breeds.map((b: any) => (
                            <Badge key={b.id} variant="outline" color="gray">{b.name}</Badge>
                        ))}
                        {animal.groups.map((g: any) => (
                            <Badge key={g.id} variant="filled" color="blue">{g.name}</Badge>
                        ))}
                    </Group>
                </Stack>

                {/* Parentage Links */}
                <Paper withBorder p="xs" radius="md" bg="gray.0">
                    <Stack gap="xs">
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light"><IconDna size={12}/></ThemeIcon>
                            <Text size="xs" fw={700} tt="uppercase">Lineage</Text>
                        </Group>
                        <Group>
                            {animal.parents.sire ? (
                                <Button 
                                    variant="subtle" size="compact-xs" color="blue"
                                    onClick={() => navigate(`/animal/${typeSlug}/${animal.parents.sire.tag}`)}
                                >
                                    Sire: {animal.parents.sire.tag}
                                </Button>
                            ) : <Text size="xs" c="dimmed">Sire: Unknown</Text>}
                            
                            {animal.parents.dam ? (
                                <Button 
                                    variant="subtle" size="compact-xs" color="pink"
                                    onClick={() => navigate(`/animal/${typeSlug}/${animal.parents.dam.tag}`)}
                                >
                                    Dam: {animal.parents.dam.tag}
                                </Button>
                            ) : <Text size="xs" c="dimmed">Dam: Unknown</Text>}
                        </Group>
                    </Stack>
                </Paper>
            </Group>

            {/* ROW 1: Performance (Equal Height) */}
            <Grid>
                {/* Battery */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack h="100%">
                        <WeightBattery 
                            current={animal.metrics.current_weight} 
                            expected={animal.metrics.expected_weight} 
                            unit={settings.weightUnit} 
                        />
                        {/* Mini Finance Card */}
                        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" fw={700}>Financials</Text>
                                <IconCoin size={18} color="gray"/>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Income</Text>
                                <Text c="teal" fw={700}>{formatCurrency(incomeTotal)}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Expense</Text>
                                <Text c="red" fw={700}>{formatCurrency(expenseTotal)}</Text>
                            </Group>
                            <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: '1px solid #eee' }}>
                                <Text size="sm" fw={700}>Profit</Text>
                                <Text fw={700} c={incomeTotal - expenseTotal >= 0 ? 'green' : 'red'}>
                                    {formatCurrency(incomeTotal - expenseTotal)}
                                </Text>
                            </Group>
                        </Paper>
                    </Stack>
                </Grid.Col>

                {/* Weight Chart */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Group justify="space-between" mb="md">
                            <Group>
                                <IconScale size={20} />
                                <Text fw={700}>Growth Curve</Text>
                            </Group>
                            <Button size="xs" variant="light">Log Weight</Button>
                        </Group>
                        <AreaChart
                            h={250}
                            data={weightData}
                            dataKey="date"
                            series={[{ name: 'weight', color: 'blue.6', label: `Weight (${settings.weightUnit})` }]}
                            curveType="monotone"
                            tickLine="y"
                        />
                    </Paper>
                </Grid.Col>
            </Grid>

            {/* ROW 2: Operations & Production */}
            <Grid mt="md">
                {/* Feed Consumption */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Group justify="space-between" mb="md">
                            <Group>
                                <IconBowl size={20} />
                                <Text fw={700}>Feed Intake</Text>
                            </Group>
                            <Button size="xs" variant="light" color="orange">Log Feed</Button>
                        </Group>
                        {feedData.length > 0 ? (
                            <BarChart
                                h={250}
                                data={feedData}
                                dataKey="date"
                                series={[{ name: 'amount', color: 'orange.6', label: `Feed (${settings.weightUnit})` }]}
                            />
                        ) : (
                            <Text c="dimmed" ta="center" py="xl">No feed records found.</Text>
                        )}
                    </Paper>
                </Grid.Col>

                {/* Production (Milk/Eggs) */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Group justify="space-between" mb="md">
                            <Group>
                                <IconCalendarEvent size={20} />
                                <Text fw={700}>Production Output</Text>
                            </Group>
                            <Button size="xs" variant="light" color="green">Log Production</Button>
                        </Group>
                        {productionData.length > 0 ? (
                            <LineChart
                                h={250}
                                data={productionData}
                                dataKey="date"
                                series={[
                                    { name: 'milk', color: 'blue.5', label: 'Milk' },
                                    { name: 'egg', color: 'yellow.5', label: 'Eggs' },
                                    { name: 'meat', color: 'red.5', label: 'Meat' }
                                ]}
                                curveType="linear"
                            />
                        ) : (
                            <Text c="dimmed" ta="center" py="xl">No production records found.</Text>
                        )}
                    </Paper>
                </Grid.Col>
            </Grid>

            {/* Upcoming Events (Placeholder for now) */}
            <Paper withBorder p="md" radius="md" mt="md">
                <Text fw={700} mb="sm">Upcoming Events & Tasks</Text>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                    <Paper bg="gray.1" p="xs" radius="sm">
                        <Text size="xs" fw={700}>Vaccination: Gumboro</Text>
                        <Text size="xs" c="dimmed">Due: 12th Dec (Predicted)</Text>
                    </Paper>
                    {/* Add more logic here later based on Type Schedule */}
                </SimpleGrid>
            </Paper>

        </Container>
    );
}