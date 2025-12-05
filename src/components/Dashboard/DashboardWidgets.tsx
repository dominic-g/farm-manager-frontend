import { Paper, Text, Table, Badge, Group, ScrollArea, ThemeIcon, Grid } from '@mantine/core';
import { IconAlertTriangle, IconCalendarEvent, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { useSettings } from '../../context/SettingsContext';

export function DashboardWidgets({ data }: { data: any }) {
    const { formatCurrency } = useSettings();
    
    // 1. Low Stock Widget
    const stockRows = data?.low_stock?.map((item: any) => (
        <Table.Tr key={item.name}> {/* FIXED TYPO HERE */}
            <Table.Td>{item.name}</Table.Td>
            <Table.Td>
                <Badge color="red" variant="light">
                    {item.stock_current} {item.unit}
                </Badge>
            </Table.Td>
        </Table.Tr>
    ));

    // 2. Financial Widget
    const financeRows = data?.recent_finance?.map((item: any, index: number) => (
        <Table.Tr key={index}>
            <Table.Td>
                <Group gap="xs">
                    <ThemeIcon color={item.type === 'income' ? 'teal' : 'red'} variant="light" size="sm">
                        {item.type === 'income' ? <IconTrendingUp size={12}/> : <IconTrendingDown size={12}/>}
                    </ThemeIcon>
                    <Text size="sm">{item.description}</Text>
                </Group>
            </Table.Td>
            <Table.Td align="right">
                <Text size="sm" fw={500} c={item.type === 'income' ? 'teal' : 'red'}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Grid mt="md">
            {/* Low Stock Alert */}
            <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md" h="100%">
                    <Group mb="md">
                        <IconAlertTriangle size={20} color="orange" />
                        <Text fw={700}>Low Stock Alerts</Text>
                    </Group>
                    {stockRows && stockRows.length > 0 ? (
                        <Table>
                            <Table.Thead>
                                <Table.Tr><Table.Th>Resource</Table.Th><Table.Th>Level</Table.Th></Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{stockRows}</Table.Tbody>
                        </Table>
                    ) : (
                        <Text c="dimmed" size="sm">All resources strictly monitored. Good job!</Text>
                    )}
                </Paper>
            </Grid.Col>

            {/* Upcoming Events */}
            <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md" h="100%">
                    <Group mb="md">
                        <IconCalendarEvent size={20} color="blue" />
                        <Text fw={700}>Upcoming (7 Days)</Text>
                    </Group>
                    <ScrollArea h={200}>
                        {data?.upcoming_events?.length > 0 ? (
                            data.upcoming_events.map((event: any, i: number) => (
                                <Group key={i} mb="sm" justify="space-between">
                                    <Text size="sm">{event.message}</Text>
                                    <Badge size="xs">{new Date(event.trigger_date).toLocaleDateString()}</Badge>
                                </Group>
                            ))
                        ) : (
                            <Text c="dimmed" size="sm">No upcoming tasks scheduled.</Text>
                        )}
                    </ScrollArea>
                </Paper>
            </Grid.Col>

            {/* Recent Transactions */}
            <Grid.Col span={12}>
                <Paper withBorder p="md" radius="md">
                    <Text fw={700} mb="md">Recent Transactions</Text>
                    <Table>
                        <Table.Tbody>
                            {financeRows}
                            {(!data?.recent_finance || data.recent_finance.length === 0) && (
                                <Table.Tr><Table.Td><Text c="dimmed">No recent transactions found.</Text></Table.Td></Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>
            </Grid.Col>
        </Grid>
    );
}