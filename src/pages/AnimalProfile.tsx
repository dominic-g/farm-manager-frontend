import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Title, Group, Text, Badge, Stack, LoadingOverlay, ThemeIcon, Button, SimpleGrid, Alert } from '@mantine/core';
// import { useQuery } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AreaChart, BarChart, LineChart } from '@mantine/charts';
import { IconScale, IconBowl, IconCoin, IconGenderMale, IconGenderFemale, IconDna, IconCalendarEvent, IconHeartHandshake, IconBabyCarriage } from '@tabler/icons-react';
import { NotFound } from './NotFound';
import { WeightBattery } from '../components/Visuals/WeightBattery';
import { useSettings } from '../context/SettingsContext';
import { LogEventModal } from '../components/Modals/LogEventModal';
import { MatingModal } from '../components/Modals/MatingModal';
import { CreateAnimalModal } from '../components/Modals/CreateAnimalModal'; 
import { Tabs, Timeline } from '@mantine/core'; // Add Timeline

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function AnimalProfile() {
    const { typeSlug, tag } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { formatWeight, formatCurrency, settings } = useSettings();
    const [logModal, setLogModal] = useState<{ open: boolean, type: string }>({ open: false, type: 'feed' });

    // Helper to open modal
    const openLog = (type: string) => setLogModal({ open: true, type });
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

    const [matingModalOpen, setMatingModalOpen] = useState(false);
    const [birthModalOpen, setBirthModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('overview');

    const isFemale = animal?.gender === 'female';
    const maturityDays = animal?.config?.lifecycle?.maturity?.female || 0;
    const currentAge = animal?.age_days || 0;
    
    // Check if mature (if setting exists)
    const isMature = maturityDays > 0 ? currentAge >= maturityDays : true; 
    
    const isPregnant = animal?.reproduction?.status === 'pregnant';


    if (isLoading) return <LoadingOverlay visible={true} />;
    if (isError || !animal) return <NotFound />;

    const reproductionType = animal.config?.lifecycle?.type || 'birth';
    const productionEventType = reproductionType === 'hatching' ? 'produce_egg' : 'produce_milk';
    const productionLabel = reproductionType === 'hatching' ? 'Eggs' : 'Milk';

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

                    {/*<Button 
                        size="xs" variant="light" 
                        onClick={() => setLogModal({ open: true, type: 'weight' })} // Open Modal
                    >
                        Log Weight
                    </Button>*/}
                </Stack>

                {/* Parentage Links */}
                <Paper withBorder p="xs" radius="md" variant="subtle" bg={animal.gender === 'male' ? 'blue' : 'pink'}>
                    <Stack gap="xs" >
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" bg="rgba(250,250,250,.6)"><IconDna size={12} color={animal.gender === 'male' ? 'blue' : 'black'}/></ThemeIcon>
                            <Text size="xs" fw={700} tt="uppercase">Lineage</Text>
                        </Group>
                        <Group>
                            {animal.parents.sire ? (
                                <Button 
                                    variant="fill" size="compact-xs" color="white"
                                    onClick={() => navigate(`/animal/${typeSlug}/${animal.parents.sire.tag}`)}
                                >
                                    Sire: {animal.parents.sire.tag}
                                </Button>
                            ) : <Text size="xs" c="gray.4">Sire: Unknown</Text>}
                            
                            {animal.parents.dam ? (
                                <Button 
                                    variant="fill" size="compact-xs" color="white"
                                    onClick={() => navigate(`/animal/${typeSlug}/${animal.parents.dam.tag}`)}
                                >
                                    Dam: {animal.parents.dam.tag}
                                </Button>
                            ) : <Text size="xs" c="gray.4">Dam: Unknown</Text>}
                        </Group>
                    </Stack>
                </Paper>
            </Group>


            <Tabs value={activeTab} onChange={setActiveTab} mt="lg">
                <Tabs.List>
                    <Tabs.Tab value="overview">Overview</Tabs.Tab>
                    {isFemale && <Tabs.Tab value="reproduction" color="pink">Reproduction</Tabs.Tab>}
                </Tabs.List>

                <Tabs.Panel value="overview" pt="md">
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
                                <Group justify="space-between" mb="md" wrap="nowrap">
                                    <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                                        <IconScale size={20} style={{ flexShrink: 0 }} />
                                        <Text fw={700} truncate>Growth Curve</Text>
                                    </Group>
                                    <Button size="xs" variant="light" onClick={() => openLog('weight')} style={{ flexShrink: 0 }}>
                                        Log Weight
                                    </Button>
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
                                <Group justify="space-between" mb="md" wrap="nowrap">
                                    <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                                        <IconBowl size={20} style={{ flexShrink: 0 }} />
                                        <Text fw={700} truncate>Feed Intake</Text>
                                    </Group>
                                    <Button size="xs" variant="light" color="orange" onClick={() => openLog('feed')} style={{ flexShrink: 0 }}>
                                        Log Feed
                                    </Button>
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
                                <Group justify="space-between" mb="md" wrap="nowrap">
                                    <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                                        <IconCalendarEvent size={20} style={{ flexShrink: 0 }} />
                                        <Text fw={700} truncate>Production ({productionLabel})</Text>
                                    </Group>
                                    <Button size="xs" variant="light" color="green" onClick={() => openLog(productionEventType)} style={{ flexShrink: 0 }}>
                                        Log {productionLabel}
                                    </Button>
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
                            <Paper bg="gray.2" p="xs" radius="sm">
                                <Text size="xs" fw={700} color="green.6">Vaccination: Gumboro</Text>
                                <Text size="xs" c="dimmed">Due: 12th Dec (Predicted)</Text>
                            </Paper>
                            {/* Add more logic here later based on Type Schedule */}
                        </SimpleGrid>
                    </Paper>
                </Tabs.Panel>

                {isFemale && (
                    <Tabs.Panel value="reproduction" pt="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Paper withBorder p="md" radius="md">
                                    <Group justify="space-between" mb="md">
                                        <Text fw={700}>Current Status</Text>
                                        
                                        {/* DYNAMIC STATUS BADGE */}
                                        {!isMature ? (
                                            <Badge size="lg" color="gray">Immature</Badge>
                                        ) : (
                                            <Badge size="lg" color={isPregnant ? 'green' : 'pink'}>
                                                {animal.reproduction.status || 'Open (Ready)'}
                                            </Badge>
                                        )}
                                    </Group>

                                    {/* STATE HANDLING */}
                                    {!isMature ? (
                                        <Alert color="gray" title="Not Reached Maturity">
                                            This animal is <b>{currentAge} days</b> old. 
                                            Maturity is reached at <b>{maturityDays} days</b>.
                                            She cannot be served yet.
                                        </Alert>
                                    ) : isPregnant ? (
                                        <Stack>
                                            <Alert color="green">
                                                Due Date: <b>{new Date(animal.reproduction.due_date).toDateString()}</b><br/>
                                                Sire: {animal.reproduction.current_sire || 'Unknown'}
                                            </Alert>
                                            <Button 
                                                fullWidth color="green" 
                                                onClick={() => setBirthModalOpen(true)}
                                            >
                                                Log Birth (Add Offspring)
                                            </Button>
                                        </Stack>
                                    ) : (
                                        <Stack>
                                            <Text size="sm" c="dimmed">
                                                Animal is active and ready for service.
                                            </Text>
                                            <Button 
                                                fullWidth color="pink" variant="light" 
                                                onClick={() => setMatingModalOpen(true)}
                                            >
                                                Log Mating / Service
                                            </Button>
                                        </Stack>
                                    )}
                                </Paper>
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Paper withBorder p="md" radius="md">
                                    <Text fw={700} mb="md">History</Text>
                                    {/*<Timeline active={0} bulletSize={14} lineWidth={2}>
                                        {animal.reproduction.history?.map((log: any, i: number) => (
                                            <Timeline.Item key={i} title="Mating" bullet={<IconHeartHandshake size={10}/>}>
                                                <Text c="dimmed" size="xs">{new Date(log.event_date).toLocaleDateString()}</Text>
                                            </Timeline.Item>
                                        ))}
                                    </Timeline>*/}
                                    <Timeline active={0} bulletSize={24} lineWidth={2}>
                                        {animal.reproduction.history?.map((log: any, i: number) => {
                                            const isBirth = log.event_type === 'birth';
                                            
                                            return (
                                                <Timeline.Item 
                                                    key={log.id} 
                                                    title={isBirth ? "Gave Birth" : "Mating Service"} 
                                                    bullet={isBirth ? <IconBabyCarriage size={14}/> : <IconHeartHandshake size={14}/>}
                                                    color={isBirth ? "green" : "pink"}
                                                >
                                                    <Text c="dimmed" size="xs">
                                                        {new Date(log.event_date).toLocaleDateString()}
                                                    </Text>
                                                    
                                                    {isBirth ? (
                                                        <Group gap="xs" mt={4}>
                                                            <Badge size="xs" color="green" variant="light">
                                                                {log.value_primary} Offspring
                                                            </Badge>
                                                            <Button 
                                                                variant="subtle" size="compact-xs" 
                                                                onClick={() => navigate(`/birth/${log.id}`)}
                                                            >
                                                                View Details
                                                            </Button>
                                                        </Group>
                                                    ) : (
                                                       <Text size="xs" mt={4}>
                                                           {/* Parse JSON notes if needed, or just static text */}
                                                           Service Recorded
                                                       </Text>
                                                    )}
                                                </Timeline.Item>
                                            );
                                        })}
                                    </Timeline>
                                </Paper>
                            </Grid.Col>
                        </Grid>
                    </Tabs.Panel>
                )}
            </Tabs>

            {/* Modals */}
            <MatingModal 
                opened={matingModalOpen} 
                close={() => setMatingModalOpen(false)} 
                animal={animal} 
            />

            {/* Reuse CreateAnimalModal for Birth! */}
            {/* We pre-fill parent info */}
            {/*{birthModalOpen && (
                <CreateAnimalModal 
                    opened={birthModalOpen}
                    close={() => setBirthModalOpen(false)}
                    parentType={{ 
                        id: animal.config?.id || 0, 
                        title: { rendered: 'Offspring' }, 
                        // Mock the config object structure expected by modal
                        farm_lifecycle: animal.config?.lifecycle
                    }}
                    // We can pass initialValues prop to CreateAnimalModal to pre-fill parents
                    // Note: You might need to update CreateAnimalModal to accept 'initialValuesOverride'
                />
            )}*/}

            {birthModalOpen && (
                <CreateAnimalModal 
                    opened={birthModalOpen}
                    close={() => {
                        setBirthModalOpen(false);
                        // Refresh to see status change
                        queryClient.invalidateQueries({ queryKey: ['animal'] }); 
                    }}
                    // parentType={animal?.config} // Pass the mother's type config
                    parentType={{ 
                        id: animal.type_id, 
                        title: { rendered: 'Offspring' }, 
                        farm_lifecycle: animal.config?.lifecycle,
                        farm_feed: animal.config?.farm_feed
                    }}
                    isBirth={true}
                    initialParents={{
                        // Current animal is the MOTHER
                        dam: String(animal.id),
                        // Get Sire ID from reproduction status
                        sire: animal.reproduction?.current_sire_id ? String(animal.reproduction.current_sire_id) : null
                    }}
                />
            )}


            <LogEventModal 
                opened={logModal.open}
                close={() => setLogModal({ ...logModal, open: false })}
                animalIds={animal ? [animal.id] : []} // Pass Single ID
                initialEventType={logModal.type}
                parentType={animal?.config}
            />

        </Container>
    );
}