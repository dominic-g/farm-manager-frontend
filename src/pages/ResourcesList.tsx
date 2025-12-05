import { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Table, Paper, Badge, Tabs, Modal, TextInput, NumberInput, Select, Stack, MultiSelect, Progress, ActionIcon, Text } from '@mantine/core'; // Added MultiSelect
import { IconPlus, IconShoppingCart, IconAlertTriangle, IconEdit } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useSettings } from '../context/SettingsContext';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function ResourcesList() {
    const { settings } = useSettings();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string | null>('feed');
    const [modalOpened, setModalOpened] = useState(false);
    const [selectedResource, setSelectedResource] = useState<any>(null);

    // 1. Fetch Animal Types for the linking dropdown
    const { data: typeData } = useAnimalTypes(1, 100);
    const animalTypes = typeData?.data || [];
    const typeOptions = animalTypes.map(t => ({ value: String(t.id), label: t.title.rendered || t.title.raw }));

    const { data: resources } = useQuery({
        queryKey: ['resources', activeTab],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/resources?type=${activeTab}`);
            return res.data;
        }
    });

    const form = useForm({
        initialValues: {
            name: '',
            quantity: 0,
            unit: 'kg',
            cost: 0,
            low_stock_threshold: 10,
            target_type_ids: [] as string[]
        },
    });

    const handleOpen = (resource?: any) => {
        setSelectedResource(resource || null);
        if (resource) {
            // Parse JSON string from DB to array for MultiSelect
            let existingTargets: string[] = [];
            try {
                if (resource.target_type_ids) {
                    existingTargets = JSON.parse(resource.target_type_ids).map(String);
                }
            } catch (e) {}

            form.setValues({
                name: resource.name,
                quantity: 0,
                unit: resource.unit,
                cost: 0,
                low_stock_threshold: Number(resource.low_stock_threshold),
                target_type_ids: existingTargets // Load existing links
            });
        } else {
            form.reset();
            form.setFieldValue('unit', activeTab === 'medicine' ? 'ml' : 'kg');
        }
        setModalOpened(true);
    };

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            return axios.post(`${API_BASE}/resources`, {
                id: selectedResource?.id,
                type: activeTab,
                ...values,
                // Ensure IDs are numbers for backend consistency, though strings work if sanitized
                target_type_ids: values.target_type_ids.map(Number) 
            });
        },
        onSuccess: () => {
            notifications.show({ title: 'Success', message: 'Inventory updated', color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            setModalOpened(false);
        }
    });

    const rows = resources?.map((res: any) => {
        const isLow = Number(res.stock_current) <= Number(res.low_stock_threshold);
        return (
            <Table.Tr key={res.id}>
                <Table.Td fw={500}>
                    <Text 
                        fw={500} 
                        style={{ cursor: 'pointer' }} 
                        c="blue"
                        onClick={() => navigate(`/resources/${res.id}`)}
                    >
                        {res.name}
                    </Text>
                    {isLow && <Badge color="red" size="xs" ml="xs" leftSection={<IconAlertTriangle size={10}/>}>Low Stock</Badge>}
                </Table.Td>
                <Table.Td>
                    {res.stock_current} {res.unit}
                    <Progress value={(res.stock_current / (res.stock_current + 50)) * 100} color={isLow ? 'red' : 'blue'} size="xs" mt={5} />
                </Table.Td>
                <Table.Td>{res.low_stock_threshold} {res.unit}</Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Button size="compact-xs" variant="light" color="green" leftSection={<IconShoppingCart size={14}/>} onClick={() => handleOpen(res)}>
                            Restock
                        </Button>

                        <ActionIcon variant="subtle" onClick={(e) => { e.stopPropagation(); handleOpen(res); }}>
                            <IconEdit size={16}/>
                        </ActionIcon>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Inventory</Title>
                <Button leftSection={<IconPlus size={18}/>} onClick={() => handleOpen()}>Add New Item</Button>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab value="feed">Feeds</Tabs.Tab>
                    <Tabs.Tab value="medicine">Medicine</Tabs.Tab>
                    <Tabs.Tab value="equipment">Equipment</Tabs.Tab>
                </Tabs.List>

                <Paper withBorder radius="md">
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Current Stock</Table.Th>
                                <Table.Th>Alert Level</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rows}
                            {resources?.length === 0 && <Table.Tr><Table.Td colSpan={4} align="center">No items found.</Table.Td></Table.Tr>}
                        </Table.Tbody>
                    </Table>
                </Paper>
            </Tabs>

            <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={selectedResource ? `Restock ${selectedResource.name}` : "Add New Item"}>
                <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
                    <Stack>
                        {!selectedResource && (
                            <TextInput label="Item Name" placeholder="e.g. Growers Pellets" required {...form.getInputProps('name')} />
                        )}
                        
                        <Group grow>
                            <NumberInput label={selectedResource ? "Quantity to Add" : "Initial Stock"} min={0} {...form.getInputProps('quantity')} />
                            <Select 
                                label="Unit" 
                                data={['kg', 'g', 'lb', 'ml', 'L', 'dose', 'pcs']} 
                                {...form.getInputProps('unit')}
                                disabled={!!selectedResource} 
                            />
                        </Group>

                        {/* MultiSelect to link to Animal Types (Available for ALL tabs) */}
                        <MultiSelect 
                            label="Restricted To (Optional)"
                            description="Only show this item when logging for these animals"
                            placeholder="Select Animal Types..."
                            data={typeOptions}
                            searchable
                            clearable
                            {...form.getInputProps('target_type_ids')}
                        />

                        <NumberInput label={`Total Cost (${settings.currency})`} description="This will be logged as an Expense" min={0} {...form.getInputProps('cost')} />
                        <NumberInput label="Low Stock Alert Threshold" min={0} {...form.getInputProps('low_stock_threshold')} />

                        <Button type="submit" loading={mutation.isPending} mt="md">{selectedResource ? 'Update Stock' : 'Create Item'}</Button>
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
}