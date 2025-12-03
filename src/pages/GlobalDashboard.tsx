import { Container, Title, Text, Paper } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { DashboardWidgets } from '../components/Dashboard/DashboardWidgets';
import { AreaChart } from '@mantine/charts';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Mock data for the chart (until we build the historical data API)
const chartData = [
  { date: 'Mar 22', Income: 2890, Expense: 2338 },
  { date: 'Mar 23', Income: 2756, Expense: 2103 },
  { date: 'Mar 24', Income: 3322, Expense: 986 },
  { date: 'Mar 25', Income: 3470, Expense: 2108 },
  { date: 'Mar 26', Income: 3129, Expense: 1726 },
];

export function GlobalDashboard() {
    const { user } = useAuth();
    const { formatCurrency } = useSettings();
    
    // Fetch Summary Stats from our new PHP endpoint
    const { data: stats, isLoading } = useQuery({
        queryKey: ['globalStats'],
        queryFn: async () => {
            // Note: We used a custom namespace 'farm/v1', not 'wp/v2'
            // We need to adjust the URL base or hardcode the full path
            const baseUrl = API_BASE.replace('/wp/v2', '/farm/v1'); 
            const res = await axios.get(`${baseUrl}/stats/summary`);
            return res.data;
        }
    });
    const { data: details } = useQuery({
        queryKey: ['globalDetails'],
        queryFn: async () => {
            const rootApi = API_BASE.replace('/wp/v2', ''); 
            const res = await axios.get(`${rootApi}/farm/v1/stats/detailed`);
            return res.data;
        }
    });

    // Transform API data for the Grid
    const gridData = [
        { title: 'Total Animals', icon: 'paw', value: stats?.total_animals || '0', diff: 12 },
        { title: 'Animal Types', icon: 'discount', value: stats?.total_types || '0', diff: 0 },
        { title: 'Revenue', icon: 'coin', value: formatCurrency(stats?.income || 0), diff: 0 },
        { title: 'Expenses', icon: 'receipt', value: formatCurrency(stats?.expense || 0), diff: 0 },
    ];

    return (
        <Container fluid>
            <Title order={2} mb="md">Farm Overview</Title>
            
            <StatsGrid data={gridData as any} />

            <DashboardWidgets data={details} />

            <Paper withBorder p="md" radius="md" mt="lg">
                <Text size="lg" fw={700} mb="md">Financial Performance</Text>
                <AreaChart
                    h={300}
                    data={chartData}
                    dataKey="date"
                    series={[
                        { name: 'Income', color: 'teal.6' },
                        { name: 'Expense', color: 'red.6' },
                    ]}
                    curveType="monotone"
                />
            </Paper>
        </Container>
    );
}