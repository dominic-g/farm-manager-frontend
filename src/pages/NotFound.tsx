import { Container, Title, Text, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconError404 } from '@tabler/icons-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Container className="root" pt={80} pb={80}>
        <div style={{ textAlign: 'center' }}>
            <IconError404 size={120} stroke={1.5} color="var(--mantine-color-blue-6)" />
            <Title order={1} mt="xl">Nothing to see here</Title>
            <Text c="dimmed" size="lg" ta="center" mt="md">
            Page you are trying to open does not exist. You may have mistyped the address, or the
            page has been moved to another URL.
            </Text>
            <Group justify="center" mt="xl">
            <Button size="md" onClick={() => navigate('/')}>Take me back to home page</Button>
            </Group>
        </div>
    </Container>
  );
}