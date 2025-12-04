import { useState } from 'react';
import { Container, Title, Button, Group, Table, ActionIcon, Text, Badge, Paper, LoadingOverlay } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { useBreeds } from '../hooks/useBreeds';
import { CreateBreedModal } from '../components/Modals/CreateBreedModal'; 
import { NotFound } from './NotFound';

export function BreedsList() {
    // const { slug } = useParams();
    // const { data: types } = useAnimalTypes();
    // const currentType = types?.find(t => t.slug === slug);
    
    // const { data: breeds, isLoading } = useBreeds(currentType?.id);
    // const [modalOpened, setModalOpened] = useState(false);
    // const [editId, setEditId] = useState<number | null>(null);

    // const handleEdit = (id: number) => {
    //     setEditId(id);
    //     setModalOpened(true);
    // };

    // const handleCreate = () => {
    //     setEditId(null);
    //     setModalOpened(true);
    // };
    const { slug } = useParams();
    const { data: types, isLoading: typesLoading } = useAnimalTypes();
    
    const currentType = types?.find(t => t.slug === slug);
    const { data: breeds, isLoading: breedsLoading } = useBreeds(currentType?.id);
    
    const [modalOpened, setModalOpened] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const rawTitle = currentType?.title.rendered || 'Animal';
    const title = rawTitle.endsWith('s') ? `${rawTitle}' Breeds` : `${rawTitle}'s Breeds`;

    // Loading State
    if (typesLoading) return <LoadingOverlay visible={true} />;

    // 404 Check: If loaded, but slug doesn't match any type -> Show 404
    if (!currentType) {
        return <NotFound />;
    }

    const handleEdit = (id: number) => {
        setEditId(id);
        setModalOpened(true);
    };

    const handleCreate = () => {
        setEditId(null);
        setModalOpened(true);
    };

    const rows = breeds?.map((breed: any) => (
        <Table.Tr key={breed.id}>
            <Table.Td fw={500}>{breed.title.rendered}</Table.Td>
            <Table.Td>
                <Group gap={5}>
                    <Badge variant="filled" color="blue" size="sm">
                        {breed.stats?.total || 0} Total
                    </Badge>
                    {/* Only show detail if there are animals */}
                    {breed.stats?.total > 0 && (
                        <Group gap={2}>
                            <Badge variant="outline" color="green" size="xs" title="Pure Breeds">
                                P: {breed.stats?.pure}
                            </Badge>
                            <Badge variant="outline" color="orange" size="xs" title="Cross Breeds">
                                X: {breed.stats?.cross}
                            </Badge>
                        </Group>
                    )}
                </Group>
            </Table.Td>
            <Table.Td>
                {/* Visual check if it has overrides */}
                {breed.farm_lifecycle ? <Badge color="blue">Custom Lifecycle</Badge> : <Badge color="gray" variant="light">Inherited</Badge>}
            </Table.Td>
            <Table.Td>
                {breed.farm_feed ? <Badge color="orange">Custom Feed</Badge> : <Badge color="gray" variant="light">Inherited</Badge>}
            </Table.Td>
            <Table.Td>
                <Group gap={0} justify="flex-end">
                    <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(breed.id)}>
                        <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red">
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <Title order={3}>{title}</Title>
                <Button leftSection={<IconPlus size={18}/>} onClick={handleCreate}>
                    Add Breed
                </Button>
            </Group>

            <Paper withBorder radius="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Breed Name</Table.Th>
                            <Table.Th>Count</Table.Th>
                            <Table.Th>Lifecycle</Table.Th>
                            <Table.Th>Feed Schedule</Table.Th>
                            <Table.Th />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows}
                        {breeds?.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={4}>
                                    <Text c="dimmed" ta="center" py="md">No breeds defined. Animals will use generic settings.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

            {currentType && (
                <CreateBreedModal 
                    opened={modalOpened} 
                    close={() => setModalOpened(false)} 
                    parentType={currentType} 
                    editId={editId}
                />
            )}
        </Container>
    );
}