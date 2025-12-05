import { useState } from 'react';
import { Container, Title, Table, Paper, Badge, Group, Select, Text, Pagination, Button, ActionIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconMinus, IconEdit } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSettings } from '../context/SettingsContext';
import { TransactionModal } from '../components/Modals/TransactionModal';
import { FinancialCorrectionModal } from '../components/Modals/FinancialCorrectionModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function FinanceList() {
    const { formatCurrency } = useSettings();
    const [page, setPage] = useState(1);
    const [type, setType] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [correctItem, setCorrectItem] = useState<any>(null);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
    const openModal = (type: 'income' | 'expense') => {
        setModalType(type);
        setModalOpen(true);
    };

    const { data } = useQuery({
        queryKey: ['finance', page, type, dateRange],
        queryFn: async () => {
            const params: any = { page, type };
            if(dateRange[0]) params.start_date = dateRange[0].toISOString().split('T')[0];
            if(dateRange[1]) params.end_date = dateRange[1].toISOString().split('T')[0];

            const res = await axios.get(`${API_BASE}/finance`, { params });
            return {
                items: res.data,
                total: Number(res.headers['x-wp-total'] || 0)
            };
        }
    });

    const items_ = data?.items || [];
    const items = items_?.items || [];

    // console.info(data);
    const totalPages = Math.ceil((data?.total || 0) / 20);

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Financial Ledger</Title>
                <Group>
                    <Button 
                        color="teal" 
                        leftSection={<IconPlus size={16}/>}
                        onClick={() => openModal('income')}
                    >
                        Add Income
                    </Button>
                    <Button 
                        color="red" 
                        leftSection={<IconMinus size={16}/>}
                        onClick={() => openModal('expense')}
                    >
                        Add Expense
                    </Button>
                </Group>
                {/*<Group>
                    <Select placeholder="Type" data={['income', 'expense']} value={type} onChange={setType} clearable />
                    <DatePickerInput type="range" placeholder="Filter by Date" value={dateRange} onChange={setDateRange} />
                </Group>*/}
                <Group my="md" justify="space-between">
                     <Group>
                        <Select placeholder="Type" data={['income', 'expense']} value={type} onChange={setType} clearable />
                        <DatePickerInput type="range" placeholder="Filter by Date" value={dateRange} onChange={setDateRange} w={250} />
                     </Group>
                </Group>
            </Group>

            <Paper withBorder radius="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th>Category</Table.Th>
                            <Table.Th align="right">Amount</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((item: any) => (
                            <Table.Tr key={item.id}>
                                <Table.Td>{new Date(item.date_transaction).toLocaleDateString()}</Table.Td>
                                <Table.Td>{item.description}</Table.Td>
                                <Table.Td><Badge color="gray">{item.category}</Badge></Table.Td>
                                <Table.Td>
                                    <Text fw={700} c={item.type === 'income' ? 'teal' : 'red'}>
                                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    {item.status !== 'correction' && (
                                        <ActionIcon 
                                            variant="subtle" color="blue" 
                                            onClick={() => setCorrectItem(item)}
                                            title="Correct this entry"
                                        >
                                            <IconEdit size={16}/>
                                        </ActionIcon>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
            
            {totalPages > 1 && <Group justify="center" mt="md"><Pagination total={totalPages} value={page} onChange={setPage}/></Group>}

            <TransactionModal 
                opened={modalOpen} 
                close={() => setModalOpen(false)} 
                initialType={modalType} 
            />

            {/* Register the New Modal */}
            <FinancialCorrectionModal 
                opened={!!correctItem} 
                close={() => setCorrectItem(null)} 
                transaction={correctItem} 
            />
        </Container>
    );
}