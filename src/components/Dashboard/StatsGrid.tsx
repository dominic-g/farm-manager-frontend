import { Group, Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import {
  IconUserPlus,
  IconDiscount2,
  IconReceipt2,
  IconCoin,
  IconArrowUpRight,
  IconArrowDownRight,
  IconPaw, 
  IconScale,
  IconWeight
} from '@tabler/icons-react';
import classes from './StatsGrid.module.css';

const icons = {
  user: IconUserPlus,
  discount: IconDiscount2,
  receipt: IconReceipt2,
  coin: IconCoin,
  paw: IconPaw,
  scale: IconScale,
};

// Data format expected from API
interface StatData {
  title: string;
  // icon: keyof typeof icons;
  icon: string;
  value: string | number;
  diff: number; 
}

export function StatsGrid({ data }: { data: StatData[] }) {
  const stats = data.map((stat) => {
    const Icon = icons[stat.icon] || IconPaw;
    const diff = stat.diff || 0;
    const DiffIcon = diff > 0 ? IconArrowUpRight : IconArrowDownRight;

    return (
      <Paper withBorder p="md" radius="md" key={stat.title}>
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text 
            size="xs" 
            c="dimmed" 
            className={classes.title}
            style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                paddingRight: '10px' // Breathing room
            }}
          >
            {stat.title}
          </Text>
{/*          <Icon className={classes.icon} size={22} stroke={1.5} />*/}
          
          <ThemeIcon variant="light" color="gray" size="lg" radius="md" style={{ flexShrink: 0 }}>
             <Icon size={22} stroke={1.5} />
          </ThemeIcon>
        </Group>

        <Group align="baseline" gap="xs" mt={25} wrap="nowrap">
          <Text className={classes.value} truncate>
              {stat.value}
          </Text>
          <Text 
            c={diff > 0 ? 'teal' : 'red'} 
            fz="sm" 
            fw={500} 
            className={classes.diff}
            style={{ whiteSpace: 'nowrap' }}
          >
            <span>{diff}%</span>
            <DiffIcon size={16} stroke={1.5} />
          </Text>
        </Group>

        <Text fz="xs" c="dimmed" mt={7} lineClamp={2}>
          Compared to previous month
        </Text>
      </Paper>
    );
  });

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        {stats}
    </SimpleGrid>
  );
}