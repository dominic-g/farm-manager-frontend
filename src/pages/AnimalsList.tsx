import { useState, useEffect } from 'react';
import { 
    Container, Title, Button, Group, Table, Paper, Text, Checkbox, 
    Select, MultiSelect, LoadingOverlay, ActionIcon, Accordion, 
    RangeSlider, Stack, TextInput, Pagination, Modal, Alert  
} from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconFilter, IconEye, IconAlertCircle } from '@tabler/icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { useGroups } from '../hooks/useGroups';
import { useBreeds } from '../hooks/useBreeds';
import { CreateAnimalModal } from '../components/Modals/CreateAnimalModal';
import { LogEventModal } from '../components/Modals/LogEventModal';
import { NotFound } from './NotFound';
import { notifications } from '@mantine/notifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function AnimalsList() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient(); // For invalidating after delete
    
    // Handle Paginated Animal Types Response
    // We fetch 100 to ensure we find the current type even if it's not in the first 10
    const { data: typeData, isLoading: typesLoading } = useAnimalTypes(1, 100);
    const types = typeData?.data || []; // Access .data array
    const currentType = types.find(t => t.slug === slug);

    // --- FILTERS STATE ---
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [ageRange, setAgeRange] = useState<[number, number]>([0, 365]); 
    const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- PAGINATION STATE ---
    const [page, setPage] = useState(1);
    const PER_PAGE = 10; 

    // --- MODAL STATE ---
    const [modalOpened, setModalOpened] = useState(false);
    const [editAnimal, setEditAnimal] = useState<any>(null);
    const [logModal, setLogModal] = useState<{ open: boolean, type: string }>({ open: false, type: 'feed' });

    // Delete State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // --- SELECTION STATE ---
    const [selection, setSelection] = useState<number[]>([]);
    const [selectAllServer, setSelectAllServer] = useState(false);

    // Handle Paginated Groups & Breeds for Dropdowns
    // We pass 'true' as the 3rd argument to fetch ALL items for the dropdowns
    const { data: groupResponse } = useGroups(currentType?.id, 1, true);
    const groups = groupResponse?.data || [];

    const { data: breedResponse } = useBreeds(currentType?.id, 1, true);
    const breeds = breedResponse?.data || [];

    // --- FETCH ANIMALS (Main List) ---
    const { data: queryData, isLoading: animalsLoading, refetch } = useQuery({
        queryKey: ['animals', currentType?.id, selectedGroups, selectedBreed, selectedGender, ageRange, searchTerm, page],
        queryFn: async () => {
            if (!currentType) return { animals: [], total: 0, totalPages: 0 };
            
            const res = await axios.get(`${API_BASE}/animals`, {
                params: {
                    type_id: currentType.id,
                    group_id: selectedGroups,
                    breed_id: selectedBreed,
                    gender: selectedGender,
                    min_age: ageRange[0], 
                    max_age: ageRange[1],
                    search: searchTerm,
                    page: page,
                    per_page: PER_PAGE,
                    status: 'active,lactating'
                },
                paramsSerializer: { indexes: null } 
            });
            
            return {
                animals: res.data,
                total: Number(res.headers['x-wp-total'] || 0),
                totalPages: Number(res.headers['x-wp-totalpages'] || 0)
            };
        },
        enabled: !!currentType,
        placeholderData: (prev) => prev
    });

    const animals = queryData?.animals || [];
    const totalAnimals = queryData?.total || 0;
    const totalPages = queryData?.totalPages || 1;

    // --- DELETE MUTATION ---
    const deleteMutation = useMutation({
        mutationFn: async () => {
            // Determine payload: either list of IDs OR the current filter params
            const payload: any = {};
            if (selectAllServer) {
                payload.delete_all_filter = true;
                payload.filters = {
                    type_id: currentType?.id,
                    group_id: selectedGroups,
                    breed_id: selectedBreed,
                    gender: selectedGender,
                    min_age: ageRange[0], 
                    max_age: ageRange[1],
                    search: searchTerm
                };
            } else {
                payload.animal_ids = selection;
            }
            
            // Send DELETE request with JSON body (axios supports 'data' prop for delete)
            return axios.delete(`${API_BASE}/animals`, { data: payload });
        },
        onSuccess: (res) => {
            notifications.show({ title: 'Deleted', message: `${res.data.deleted} animals removed`, color: 'red' });
            setSelection([]);
            setSelectAllServer(false);
            setDeleteConfirmOpen(false);
            queryClient.invalidateQueries({ queryKey: ['animals'] });
        },
        onError: (err: any) => {
            notifications.show({ title: 'Error', message: err.response?.data?.message || 'Delete failed', color: 'red' });
        }
    });

    // Auto-reset Selection
    useEffect(() => {
        setSelection([]);
        setSelectAllServer(false);
        setPage(1);
    }, [selectedGroups, selectedBreed, selectedGender, ageRange, searchTerm]);

    if (typesLoading) return <LoadingOverlay visible={true} />;
    if (!currentType) return <NotFound />;

    // Handlers
    const toggleAllPage = () => {
        if (selection.length === animals.length) {
            setSelection([]);
            setSelectAllServer(false);
        } else {
            setSelection(animals.map((a: any) => a.ID));
        }
    };

    const toggleRow = (id: number) => {
        if (selectAllServer) setSelectAllServer(false);
        setSelection((current) =>
            current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
        );
    };

    const handleSelectAllServer = () => {
        setSelectAllServer(true);
        notifications.show({ title: 'Selected All', message: `All ${totalAnimals} matching animals selected`, color: 'blue' });
    };
    const handleClearSelection = () => {
        setSelection([]);
        setSelectAllServer(false);
    };

    const handleEdit = (animal: any) => {

        const editData = {
            ID: animal.ID,
            tag: animal.tag,
            gender: animal.gender,
            weight: animal.weight,
            
            // Pass the new fields
            dob: animal.dob, 
            color: animal.color, 
            
            // Pass relationships if available in list (or fetch inside modal)
            sire: animal.parents?.sire_id,
            dam: animal.parents?.dam_id,

            breed_ids: animal.breed_ids,
            group_ids: animal.group_ids
        };
        setEditAnimal(editData); 
        setModalOpened(true);
    };

    const openLogModal = (type: string) => {
        setLogModal({ open: true, type });
    };

    // Options for Dropdowns
    const groupOptions = groups.map((g: any) => ({ value: String(g.id), label: g.name }));
    const breedOptions = breeds.map((b: any) => ({ value: String(b.id), label: b.title.rendered }));

    const rows = animals.map((animal: any) => {
        const isSelected = selection.includes(animal.ID) || selectAllServer;
        return (
            <Table.Tr 
                key={animal.ID} 
                bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined} 
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                 onClick={() => navigate(`/animal/${slug}/${animal.tag}`)}
            >
                <Table.Td>
                    <Checkbox 
                        checked={isSelected} 
                        onChange={() => toggleRow(animal.ID)}
                        onClick={(e) => e.stopPropagation()} 
                    />
                </Table.Td>
                <Table.Td fw={700}>{animal.tag}</Table.Td>
                <Table.Td style={{ textTransform: 'capitalize' }}>{animal.gender}</Table.Td>
                <Table.Td>{animal.breed_names}</Table.Td>
                <Table.Td>{animal.age_days}d</Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        {/*<ActionIcon variant="subtle" color="gray" onClick={() => navigate(`/animal/${slug}/${animal.tag}`)}>
                            <IconEye size={16}/>
                        </ActionIcon>*/}
                        <ActionIcon 
                            variant="subtle" 
                            color="blue" 
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleEdit(animal);
                            }}
                        >
                            <IconEdit size={16}/>
                        </ActionIcon>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    const rawTitle = currentType?.title.rendered || 'Animal';
    const title = rawTitle.endsWith('s') ? `${rawTitle}' Inventory` : `${rawTitle}'s Inventory`;

    return (
        <Container fluid>
            {/* HEADER */}
            <Group justify="space-between" mb="lg">
                <Title order={3}>{title}</Title>
                <Button leftSection={<IconPlus size={18}/>} onClick={() => { setEditAnimal(null); setModalOpened(true); }}>
                    Add Animal
                </Button>
            </Group>

            {/* FILTERS */}
            <Accordion variant="separated" mb="md">
                <Accordion.Item value="filters">
                    <Accordion.Control icon={<IconFilter size={16}/>}>Advanced Filters</Accordion.Control>
                    <Accordion.Panel>
                        <Group align="flex-end">
                            <MultiSelect label="Filter by Groups" placeholder="Select groups" data={groupOptions} value={selectedGroups} onChange={setSelectedGroups} searchable clearable style={{ minWidth: 200 }} />
                            <Select label="Breed" placeholder="Any" data={breedOptions} value={selectedBreed} onChange={setSelectedBreed} clearable />
                            <Select label="Gender" data={['male', 'female']} value={selectedGender} onChange={setSelectedGender} clearable />
                            <Stack gap={0} style={{ flex: 1, maxWidth: 300 }}>
                                <Text size="sm" fw={500}>Age: {ageRange[0]} - {ageRange[1]} days</Text>
                                <RangeSlider min={0} max={1000} step={10} value={ageRange} onChange={setAgeRange} label={null} />
                            </Stack>
                            <TextInput label="Search" placeholder="Tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} />
                        </Group>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            {/* BULK ACTIONS BANNER */}
            {(selection.length > 0 || selectAllServer) && (
                <Paper p="sm" mb="md" bg="blue.6" withBorder>
                    <Stack gap="xs">
                        <Group justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: '10px' }}>
                            <Group>
                                <Text size="sm" fw={700} c="white">
                                    {selectAllServer ? `All ${totalAnimals} animals selected` : `${selection.length} selected`}
                                </Text>
                                {/* Clear Selection Button */}
                                {(selectAllServer || selection.length > 0) && (
                                    <Button variant="white" size="compact-xs" color="gray" onClick={handleClearSelection}>
                                        Clear Selection
                                    </Button>
                                )}
                            </Group>
                            
                            <Group gap="xs">
                                <Button size="xs" variant="white" color="dark" onClick={() => setLogModal({ open: true, type: 'feed' })}>
                                    Log Events
                                </Button>
                                <Button size="xs" variant="white" color="blue" leftSection={<IconEdit size={14}/>}>
                                    Bulk Edit
                                </Button>
                                <Button size="xs" variant="white" color="red" leftSection={<IconTrash size={14}/>} onClick={() => setDeleteConfirmOpen(true)}>
                                    Delete
                                </Button>
                            </Group>
                        </Group>

                        {/* Select All Server Prompt */}
                        {!selectAllServer && selection.length === animals.length && totalAnimals > animals.length && (
                            <Button variant="white" size="compact-xs" color="blue" onClick={handleSelectAllServer} style={{ alignSelf: 'flex-start' }}>
                                Select all {totalAnimals} matching animals from server?
                            </Button>
                        )}
                    </Stack>
                </Paper>
            )}

            <Paper withBorder radius="md">
                <LoadingOverlay visible={animalsLoading} />
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={40}>
                                <Checkbox 
                                    onChange={toggleAllPage} 
                                    checked={selection.length === animals.length && animals.length > 0}
                                    indeterminate={selection.length > 0 && selection.length !== animals.length && !selectAllServer}
                                />
                            </Table.Th>
                            <Table.Th>Tag</Table.Th>
                            <Table.Th>Gender</Table.Th>
                            <Table.Th>Breeds</Table.Th>
                            <Table.Th>Age</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows}
                        {animals.length === 0 && <Table.Tr><Table.Td colSpan={6} align="center"><Text c="dimmed" py="md">No animals found.</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>

            {totalPages > 1 && (
                <Group justify="center" mt="lg">
                    <Pagination total={totalPages} value={page} onChange={setPage} />
                </Group>
            )}

            {/* MODALS */}
            <CreateAnimalModal 
                opened={modalOpened} 
                close={() => { setModalOpened(false); setEditAnimal(null); refetch(); }} 
                parentType={currentType}
                editData={editAnimal}
            />

            <LogEventModal 
                opened={logModal.open}
                close={() => setLogModal({ ...logModal, open: false })}
                animalIds={selectAllServer ? [] : selection} // Pass empty if server mode (handled by backend filter, but LogModal needs update to support filters later. For now, works for Page selection)
                initialEventType={logModal.type}
                parentType={currentType}
            />

            {/* DELETE CONFIRM MODAL */}
            <Modal opened={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion" centered>
                <Stack>
                    <Alert color="red" icon={<IconAlertCircle />}>
                        Warning: This will permanently delete {selectAllServer ? totalAnimals : selection.length} animals.
                    </Alert>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button color="red" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete</Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}