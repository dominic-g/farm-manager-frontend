import { Container, Title, Button, Group, SimpleGrid, Paper, Text, ThemeIcon, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconArrowRight, IconEdit } from '@tabler/icons-react';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { useNavigate } from 'react-router-dom';
import { getIconComponent } from '../utils/iconMap';

interface Props {
    openCreateModal: () => void;
    openEditModal: (id: number) => void;
}

export function AnimalTypesList({ openCreateModal, openEditModal }: Props) {
    const { data: types, isLoading } = useAnimalTypes();
    const navigate = useNavigate();

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Livestock Categories</Title>
                <Button leftSection={<IconPlus size={18}/>} onClick={openCreateModal}>
                    Add New Type
                </Button>
            </Group>

            {isLoading ? <Text>Loading...</Text> : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                    {types?.map((type) => {
                        const Icon = getIconComponent(type.farm_icon);
                        return (
                            <Paper 
                                key={type.id} 
                                withBorder 
                                p="md" 
                                radius="md" 
                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                onClick={() => navigate(`/type/${type.slug}`)}
                                // Add hover effect via CSS or sx
                            >
                                <Group justify="space-between" mb="xs">
                                    <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                        <Icon size={24} />
                                    </ThemeIcon>

                                    <Group gap={5}>
                                        <Tooltip label="Edit Configuration">
                                            <ActionIcon 
                                                variant="subtle" 
                                                color="gray"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Stop click from bubbling to Paper
                                                    openEditModal(type.id);
                                                }}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                        </Tooltip>

                                        <ActionIcon variant="subtle" color="gray">
                                            <IconArrowRight size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                                
                                <Text fw={700} size="lg" mt="sm">
                                    {type.title.rendered || type.title.raw}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    Click to manage breeds, feeds, and analytics.
                                </Text>
                            </Paper>
                        )
                    })}
                </SimpleGrid>
            )}

            {types?.length === 0 && (
                <Text c="dimmed" ta="center" mt={50}>
                    No animal types found. Click "Add New Type" to get started.
                </Text>
            )}
        </Container>
    );
}