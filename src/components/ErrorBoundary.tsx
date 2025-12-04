import { Component, ReactNode } from 'react';
import { Container, Title, Text, Button, Group } from '@mantine/core';
import { IconServerOff } from '@tabler/icons-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/'; // Hard reload to clear bad state
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container className="root" pt={80} pb={80}>
                    <div style={{ textAlign: 'center' }}>
                        <IconServerOff size={120} stroke={1.5} color="var(--mantine-color-red-6)" />
                        <Title order={1} mt="xl">Something went wrong</Title>
                        <Text c="dimmed" size="lg" ta="center" mt="md">
                            The application encountered an unexpected error.
                        </Text>
                        
                        {/* Optional: Show actual error in dev mode */}
                        {import.meta.env.DEV && this.state.error && (
                            <Text c="red" size="sm" mt="md" style={{ fontFamily: 'monospace' }}>
                                {this.state.error.toString()}
                            </Text>
                        )}

                        <Group justify="center" mt="xl">
                            <Button size="md" onClick={this.handleReload}>
                                Refresh Application
                            </Button>
                        </Group>
                    </div>
                </Container>
            );
        }

        return this.props.children;
    }
}