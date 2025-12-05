import { Container, Title, Grid, Paper, Text, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { useSettings } from '../context/SettingsContext';
import { DashboardWidgets } from '../components/Dashboard/DashboardWidgets';
import { BarChart, PieChart } from '@mantine/charts'; // Added PieChart

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function ResourcesDashboard() {
    const { formatCurrency } = useSettings();

    // 1. Fetch Resources (Stock Levels)
    const { data: resourceData } = useQuery({
        queryKey: ['resources_dashboard'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/resources`); 
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        }
    });

    // 2. Fetch Recent Inventory Transactions
    /*const { data: financeData } = useQuery({
        queryKey: ['resources_finance'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/finance`, {
                params: { category: 'inventory', per_page: 5 } 
            });
            return res.data.items;
        }
    });*/

    const { data: financeData } = useQuery({
        queryKey: ['resources_finance'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/finance`, {
                params: { 
                    category: 'inventory,feed,medicine,medical,equipment,Feed,Medicine,Equipment', 
                    per_page: 5 
                } 
            });
            return res.data.items;
        }
    });

    const resources = resourceData || [];
    const transactions = financeData || [];
    
    // Stats Calculations
    const totalValue = resources.reduce((acc: number, item: any) => acc + (Number(item.stock_current) * Number(item.cost_per_unit || 0)), 0);
    const lowStockItems = resources.filter((item: any) => Number(item.stock_current) <= Number(item.low_stock_threshold));
    const totalFeedKg = resources.filter((r:any) => r.type === 'feed').reduce((acc: number, r: any) => acc + Number(r.stock_current), 0);

    const statCards = [
        { title: 'Total Inventory Value', icon: 'coin', value: formatCurrency(totalValue), diff: 0 },
        { title: 'Total Items', icon: 'discount', value: resources.length, diff: 0 },
        { title: 'Feed Stock (kg)', icon: 'scale', value: totalFeedKg.toFixed(1), diff: 0 },
        { 
            title: 'Low Stock Alerts', 
            icon: 'paw', 
            value: lowStockItems.length, 
            diff: 0, 
            diffLabel: lowStockItems.length > 0 ? 'Action Required' : 'Healthy Levels'
        },
    ];

    // Chart Data 1: Inventory Categories (Pie)
    const pieData = [
        { name: 'Feed', value: resources.filter((r:any)=>r.type==='feed').length, color: 'orange.6' },
        { name: 'Meds', value: resources.filter((r:any)=>r.type==='medicine').length, color: 'blue.6' },
        { name: 'Equip', value: resources.filter((r:any)=>r.type==='equipment').length, color: 'gray.6' },
    ];

    // Chart Data 2: Value by Category (Bar)
    const barData = [
        { name: 'Feed', value: resources.filter((r:any)=>r.type==='feed').length, color: 'orange.6' },
        { name: 'Meds', value: resources.filter((r:any)=>r.type==='medicine').length, color: 'blue.6' },
        { name: 'Equip', value: resources.filter((r:any)=>r.type==='equipment').length, color: 'gray.6' },
    ];

    // COMBINED DATA for the Bottom Widgets
    const widgetData = { 
        low_stock: lowStockItems,
        recent_finance: transactions,
        upcoming_events: [] // We don't have a resource-specific events API yet, but this placeholder keeps the layout intact
    };

    return (
        <Container fluid>
            <Title order={2} mb="lg">Inventory Dashboard</Title>
            
            <StatsGrid data={statCards as any} />
            
            <Grid mt="lg">
                {/* ROW 1: Pie Chart (Left) + Bar Chart (Right) */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Text fw={700} mb="md">Category Distribution</Text>
                        <Group justify="center">
                            <PieChart 
                                size={160} 
                                data={pieData} 
                                withTooltip 
                                tooltipDataSource="segment" 
                            />
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Text fw={700} mb="md">Items Count</Text>
                        <BarChart
                            h={250}
                            data={barData}
                            dataKey="name"
                            series={[{ name: 'value', color: 'blue.6', label: 'Items' }]}
                            tickLine="y"
                        />
                    </Paper>
                </Grid.Col>

                {/* ROW 2: The "Big Three" Widgets (Low Stock, Upcoming, Transactions) */}
                {/* We only call this ONCE, so it renders the full grid correctly */}
                <Grid.Col span={12}>
                    <DashboardWidgets data={widgetData} />
                </Grid.Col>
            </Grid>
        </Container>
    );
}