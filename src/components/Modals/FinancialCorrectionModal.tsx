import { Modal, NumberInput, TextInput, Button, Stack, Text, Alert, Group, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { useSettings } from '../../context/SettingsContext';

interface Props {
    opened: boolean;
    close: () => void;
    transaction: any;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function FinancialCorrectionModal({ opened, close, transaction }: Props) {
    const queryClient = useQueryClient();
    const { settings, formatCurrency } = useSettings();

    const form = useForm({
        initialValues: {
            new_amount: '',
            reason: ''
        },
        validate: {
            new_amount: (val) => (val === '' ? 'Amount required' : null),
            reason: (val) => (val.length < 3 ? 'Reason required' : null),
        }
    });

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            return axios.post(`${API_BASE}/finance/correct`, {
                id: transaction.id,
                new_amount: values.new_amount,
                reason: values.reason
            });
        },
        onSuccess: () => {
            notifications.show({ title: 'Success', message: 'Correction entry added', color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            close();
            form.reset();
        },
        onError: (err: any) => {
            notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed', color: 'red' });
        }
    });

    if (!transaction) return null;

    return (
        <Modal opened={opened} onClose={close} title="Correct Transaction">
            <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
                <Stack>
                    <Alert variant="light" color="blue" icon={<IconInfoCircle />}>
                        <Text size="sm">Original: <b>{formatCurrency(transaction.amount)}</b> ({transaction.description})</Text>
                        <Text size="xs" mt={5}>
                            This will create a new adjustment entry. The original record remains for audit purposes.
                        </Text>
                    </Alert>

                    <NumberInput
                        label={`Correct Amount (${settings.currency})`}
                        description="Enter the value it SHOULD have been"
                        placeholder="0.00"
                        min={0}
                        step={0.01}
                        required
                        {...form.getInputProps('new_amount')}
                    />

                    <TextInput
                        label="Reason for Correction"
                        placeholder="e.g. Typo, Wrong receipt"
                        required
                        {...form.getInputProps('reason')}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={close}>Cancel</Button>
                        <Button type="submit" loading={mutation.isPending} color="orange">
                            Apply Correction
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}