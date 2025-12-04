import { RingProgress, Text, Group, Paper, Center } from '@mantine/core';
import { IconScale } from '@tabler/icons-react';

interface Props {
    current: number;
    expected: number;
    unit: string;
}

export function WeightBattery({ current, expected, unit }: Props) {
    // Calculate Percentage Performance
    // If expected is 0 (newborn/undefined), assume 100% to avoid NaN
    const percentage = expected > 0 ? (current / expected) * 100 : 100;
    
    // Determine Color
    // > 90% = Green, 75-90% = Blue/Teal, 50-75% = Orange, < 50% = Red
    let color = 'red';
    if (percentage >= 90) color = 'green';
    else if (percentage >= 75) color = 'teal';
    else if (percentage >= 50) color = 'orange';

    return (
        <Paper withBorder p="md" radius="md">
            <Group>
                <RingProgress
                    size={80}
                    roundCaps
                    thickness={8}
                    sections={[{ value: Math.min(percentage, 100), color }]}
                    label={
                        <Center>
                            <IconScale style={{ width: 20, height: 20 }} stroke={1.5} />
                        </Center>
                    }
                />

                <div>
                    <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                        Growth Target
                    </Text>
                    <Text fw={700} size="xl">
                        {current} <Text span size="sm" c="dimmed">/ {expected.toFixed(1)} {unit}</Text>
                    </Text>
                    <Text c={color} size="sm" fw={500}>
                        {percentage.toFixed(0)}% of expected
                    </Text>
                </div>
            </Group>
        </Paper>
    );
}