import { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Table, Paper, Text, Checkbox, Select, LoadingOverlay, Badge, ActionIcon, Accordion, RangeSlider, Stack, TextInput } from '@mantine/core'; // Ensure TextInput/Stack imported
import { IconEye, IconPlus, IconTrash, IconEdit, IconFilter } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { useGroups } from '../hooks/useGroups';
import { useBreeds } from '../hooks/useBreeds';
import { CreateAnimalModal } from '../components/Modals/CreateAnimalModal';
import { NotFound } from './NotFound';
import { notifications } from '@mantine/notifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function AnimalsList() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { data: types, isLoading: typesLoading } = useAnimalTypes();
    const currentType = types?.find(t => t.slug === slug);

    const [selection, setSelection] = useState<number[]>([]);

    // Filters State
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [ageRange, setAgeRange] = useState<[number, number]>([0, 365]); 
    const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch dependencies
    const { data: groups } = useGroups(currentType?.id);
    const { data: breeds } = useBreeds(currentType?.id); 

    // Modal & Selection
    const [modalOpened, setModalOpened] = useState(false);
    // const [selection, setSelection] = useState<number[]>([]);

    // Fetch Animals
    const { data: animals, isLoading: animalsLoading, refetch } = useQuery({
        queryKey: ['animals', currentType?.id, selectedGroup, selectedBreed, selectedGender, ageRange, searchTerm],
        queryFn: async () => {
            if (!currentType) return [];
            const res = await axios.get(`${API_BASE}/animals`, {
                params: {
                    type_id: currentType.id,
                    group_id: selectedGroup,
                    breed_id: selectedBreed,
                    gender: selectedGender,
                    min_age: ageRange[0], 
                    max_age: ageRange[1],
                    search: searchTerm
                }
            });
            return res.data;
        },
        enabled: !!currentType
    });

    // Auto-reset Selection when ANY filter changes
    useEffect(() => {
        setSelection([]);
    }, [selectedGroup, selectedBreed, selectedGender, ageRange, searchTerm]);


    if (typesLoading) return <LoadingOverlay visible={true} />;
    if (!currentType) return <NotFound />;

    // --- Bulk Selection Logic ---
    const toggleAll = () => {
        if (!animals) return;
        setSelection((current) => 
            current.length === animals.length ? [] : animals.map((a: any) => a.ID)
        );
    };

    const toggleRow = (id: number) => {
        setSelection((current) =>
            current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
        );
    };

    // Prepare Options
    const groupOptions = Array.isArray(groups) ? groups.map((g: any) => ({ value: String(g.id), label: g.name })) : [];
    // 3. Define breedData for the filter
    const breedData = breeds?.map((b: any) => ({ value: String(b.id), label: b.title.rendered })) || [];

    const rows = animals?.map((animal: any) => {
        const isSelected = selection.includes(animal.ID);
        return (
            <Table.Tr key={animal.ID} bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}>
                <Table.Td>
                    <Checkbox checked={isSelected} onChange={() => toggleRow(animal.ID)} />
                </Table.Td>
                <Table.Td fw={700}>{animal.tag}</Table.Td>
                <Table.Td style={{ textTransform: 'capitalize' }}>{animal.gender}</Table.Td>
                <Table.Td>{animal.breed_names}</Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        {/* VIEW ACTION */}
                        <ActionIcon 
                            variant="subtle" 
                            color="gray"
                            onClick={() => navigate(`/animal/${slug}/${animal.tag}`)} // Navigate to Profile
                            title="View Profile"
                        >
                            <IconEye size={16}/>
                        </ActionIcon>

                        {/* EDIT ACTION */}
                        <ActionIcon 
                            variant="subtle" 
                            color="blue"
                            onClick={() => {
                                // Logic to open Modal in Edit Mode (Need to implement setEditId in modal)
                                console.log("Edit", animal.ID);
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
            <Group justify="space-between" mb="lg">
                <Title order={3}>{title}</Title>
                <Group>
                    <Select 
                        placeholder="Filter by Group" 
                        data={groupOptions} 
                        value={selectedGroup} 
                        onChange={setSelectedGroup}
                        clearable
                        leftSection={<IconFilter size={16}/>}
                        w={200}
                    />
                    <Button leftSection={<IconPlus size={18}/>} onClick={() => setModalOpened(true)}>
                        Add Animal
                    </Button>
                </Group>
            </Group>

            {/* FILTER PANEL */}
            <Accordion variant="separated" mb="md">
                <Accordion.Item value="filters">
                    <Accordion.Control icon={<IconFilter size={16}/>}>Advanced Filters</Accordion.Control>
                    <Accordion.Panel>
                        <Group align="flex-end">
                            <Select 
                                label="Breed" 
                                placeholder="Any Breed"
                                data={breedData} // <--- Now this works
                                value={selectedBreed}
                                onChange={setSelectedBreed}
                                clearable
                            />
                            <Select 
                                label="Gender" 
                                data={['male', 'female']}
                                value={selectedGender}
                                onChange={setSelectedGender}
                                clearable
                            />
                            <Stack gap={0} style={{ flex: 1, maxWidth: 300 }}>
                                <Text size="sm" fw={500}>Age (Days): {ageRange[0]} - {ageRange[1]}</Text>
                                <RangeSlider 
                                    min={0} max={1000} step={10} 
                                    value={ageRange} 
                                    onChange={setAgeRange} 
                                    label={null}
                                />
                            </Stack>
                            <TextInput 
                                label="Search" 
                                placeholder="Tag or Color" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                            />
                        </Group>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            {/* BULK ACTIONS BAR (Combined) */}
            {selection.length > 0 && (
                <Paper p="sm" mb="md" bg="blue.6" withBorder>
                    <Group justify="space-between">
                        <Group>
                            <Text size="sm" fw={500}>{selection.length} animals selected</Text>
                            {/* Server Select All Logic Placeholder */}
                            {selection.length === animals?.length && (
                                <>
                                <Button 
                                    variant="subtle" 
                                    size="xs" 
                                    onClick={() => {
                                        // Set a flag 'selectAllQuery = true' state
                                        // This flag is sent to the backend during Bulk Edit/Delete
                                        console.log('Select ALL on server');
                                        notifications.show({ title: 'Info', message: 'Select All on Server mode activated (Visual only for now)', color: 'blue' });
                                    }}
                                >
                                    Select all animals matching this filter?
                                </Button>

                                <Button size="xs" variant="white" color="orange" onClick={() => openLogModal('feed')}>
                                    Log Feed
                                </Button>
                                <Button size="xs" variant="white" color="green" onClick={() => openLogModal('weight')}>
                                    Log Weight
                                </Button>
                                </>
                            )}
                        </Group>
                        <Group>
                            <Button size="xs" variant="white" color="red" leftSection={<IconTrash size={14}/>}>
                                Delete
                            </Button>
                            <Button size="xs" variant="white" color="blue" leftSection={<IconEdit size={14}/>}>
                                Bulk Edit
                            </Button>
                        </Group>
                    </Group>
                </Paper>
            )}

            <Paper withBorder radius="md">
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 40 }}>
                                <Checkbox 
                                    onChange={toggleAll} 
                                    checked={selection.length > 0 && selection.length === animals?.length}
                                    indeterminate={selection.length > 0 && selection.length !== animals?.length}
                                />
                            </Table.Th>
                            <Table.Th>Tag</Table.Th>
                            <Table.Th>Gender</Table.Th>
                            <Table.Th>Breeds</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows}
                        {animals?.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5} align="center">
                                    <Text c="dimmed" py="md">No animals found.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

            <CreateAnimalModal 
                opened={modalOpened} 
                close={() => { setModalOpened(false); refetch(); }} 
                parentType={currentType} 
            />
        </Container>
    );
}