import { useState } from 'react';
import { Container, Title, Grid, Paper, Text, Group, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AreaChart, DonutChart } from '@mantine/charts'; // Import DonutChart
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { DashboardWidgets } from '../components/Dashboard/DashboardWidgets';
import { useSettings } from '../context/SettingsContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function FinanceDashboard() {
    const { formatCurrency } = useSettings();
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        new Date(new Date().setDate(new Date().getDate() - 30)),
        new Date()
    ]);

    const { data } = useQuery({
        queryKey: ['finance_dashboard', dateRange],
        queryFn: async () => {
            const params: any = { per_page: 5 }; // Only get top 5 recents
            if(dateRange[0]) params.start_date = dateRange[0].toISOString().split('T')[0];
            if(dateRange[1]) params.end_date = dateRange[1].toISOString().split('T')[0];
            
            const res = await axios.get(`${API_BASE}/finance`, { params });
            return res.data;
        },
        placeholderData: (prev) => prev
    });

    const stats = data?.stats || { income: 0, expense: 0, profit: 0 };

    const { data: resourceData } = useQuery({
        queryKey: ['resources_dashboard'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/resources`); 
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        }
    });

    const resources = resourceData || [];
    
    // Stats Calculations
    const totalValue = resources.reduce((acc: number, item: any) => acc + (Number(item.stock_current) * Number(item.cost_per_unit || 0)), 0);
    const lowStockItems = resources.filter((item: any) => Number(item.stock_current) <= Number(item.low_stock_threshold));
    const totalFeedKg = resources.filter((r:any) => r.type === 'feed').reduce((acc: number, r: any) => acc + Number(r.stock_current), 0);


    // 1. Transform Graph Data (Group by Date)
    const rawGraph = data?.graph_data || [];
    const chartData = rawGraph.reduce((acc: any[], curr: any) => {
        const existing = acc.find(item => item.date === curr.date);
        const val = Number(curr.total);
        if (existing) {
            if(curr.type === 'income') existing.income = val;
            if(curr.type === 'expense') existing.expense = val;
        } else {
            acc.push({
                date: curr.date,
                income: curr.type === 'income' ? val : 0,
                expense: curr.type === 'expense' ? val : 0
            });
        }
        return acc;
    }, []);

    // Transform Category Data (Pie Charts)
    const rawCats = data?.category_data || [];
    const expenseCats = rawCats
        .filter((c: any) => c.type === 'expense')
        .map((c: any) => ({ name: c.category, value: Number(c.total), color: 'red.6' }));
    
    const incomeCats = rawCats
        .filter((c: any) => c.type === 'income')
        .map((c: any) => ({ name: c.category, value: Number(c.total), color: 'teal.6' }));

    const statCards = [
        { title: 'Total Income', icon: 'coin', value: formatCurrency(stats.income), diff: 0 },
        { title: 'Total Expenses', icon: 'receipt', value: formatCurrency(stats.expense), diff: 0 },
        { 
            title: 'Net Profit', 
            icon: 'scale', 
            value: formatCurrency(stats.profit), 
            diff: 0,
            color: stats.profit >= 0 ? 'teal' : 'red' // Visual cue
        },
    ];

    // Data for Bottom Widget
    // const recentData = { recent_finance: data?.items || [] };
    // console.log(recentData);
    const widgetData = { 
        low_stock: lowStockItems,
        recent_finance: data?.items || [],
        upcoming_events: [] // We don't have a resource-specific events API yet, but this placeholder keeps the layout intact
    };

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Financial Overview</Title>
                <DatePickerInput type="range" placeholder="Pick dates" value={dateRange} onChange={setDateRange} w={200} />
            </Group>

            <StatsGrid data={statCards as any} />

            <Grid mt="lg">
                {/* ROW 1: Cash Flow Chart (Full Width or 2/3) */}
                <Grid.Col span={{ base: 12, md: 12 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Text fw={700} mb="md">Cash Flow Trend</Text>
                        {chartData.length > 0 ? (
                            <AreaChart
                                h={300}
                                data={chartData}
                                dataKey="date"
                                series={[
                                    { name: 'income', color: 'teal.6', label: 'Income' },
                                    { name: 'expense', color: 'red.6', label: 'Expense' },
                                ]}
                                curveType="monotone"
                                tickLine="y"
                                valueFormatter={(val) => new Intl.NumberFormat().format(val)}
                            />
                        ) : (
                            <Group h={300} justify="center" bg="gray.0"><Text c="dimmed">No data for selected period</Text></Group>
                        )}
                    </Paper>
                </Grid.Col>

                {/* ROW 1: Expense Breakdown (1/3 Width) */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Text fw={700} mb="md">Expense Breakdown</Text>
                        {expenseCats.length > 0 ? (
                            <Stack align="center">
                                <DonutChart 
                                    data={expenseCats} 
                                    withLabelsLine 
                                    withLabels 
                                    size={160} 
                                    thickness={20} 
                                />
                                <Stack gap="xs" mt="md" w="100%">
                                    {expenseCats.map((cat:any) => (
                                        <Group key={cat.name} justify="space-between">
                                            <Group gap={5}>
                                                <div style={{ width: 10, height: 10, backgroundColor: 'var(--mantine-color-red-6)', borderRadius: '50%' }} />
                                                <Text size="xs">{cat.name}</Text>
                                            </Group>
                                            <Text size="xs" fw={700}>{formatCurrency(cat.value)}</Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Stack>
                        ) : (
                            <Text c="dimmed" ta="center" mt={50}>No expenses recorded</Text>
                        )}
                    </Paper>
                </Grid.Col>

                {/* ROW 2: Income Breakdown (1/3) & Recent Transactions (2/3) */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md" h="100%">
                        <Text fw={700} mb="md">Income Sources</Text>
                        {incomeCats.length > 0 ? (
                            <Stack align="center">
                                <DonutChart 
                                    data={incomeCats} 
                                    withLabelsLine 
                                    withLabels 
                                    size={160} 
                                    thickness={20}
                                    // Custom colors logic would require mapping index to colors, defaulting teal here
                                    series={[{ name: 'value', color: 'teal.6' }]} 
                                />
                                <Stack gap="xs" mt="md" w="100%">
                                    {incomeCats.map((cat:any) => (
                                        <Group key={cat.name} justify="space-between">
                                            <Group gap={5}>
                                                <div style={{ width: 10, height: 10, backgroundColor: 'var(--mantine-color-teal-6)', borderRadius: '50%' }} />
                                                <Text size="xs">{cat.name}</Text>
                                            </Group>
                                            <Text size="xs" fw={700}>{formatCurrency(cat.value)}</Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Stack>
                        ) : (
                            <Text c="dimmed" ta="center" mt={50}>No income recorded</Text>
                        )}
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 12 }}>
                    {/* Reuse DashboardWidgets for consistent Table look */}
                    <DashboardWidgets data={widgetData} />
                </Grid.Col>
            </Grid>
        </Container>
    );
}