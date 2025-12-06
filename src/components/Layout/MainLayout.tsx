import { useState } from 'react';
import { AppShell, Burger, Group, Text, Button, ActionIcon, Drawer, Indicator, ScrollArea, Paper, Badge, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../Sidebar';
import { IconLogout, IconUser, IconBell, IconCheck  } from '@tabler/icons-react';
import { ThemeToggle } from '../ThemeToggle'; // Import the toggle


const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1'); 

interface Props {
    children: React.ReactNode;
    openCreateModal: () => void;
}

export function MainLayout({ children, openCreateModal }: Props) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const { user, logout } = useAuth();

  const queryClient = useQueryClient();

  // Fetch Notifications
  const { data: notifData } = useQuery({
      queryKey: ['notifications'],
      queryFn: async () => {
          const res = await axios.get(`${API_BASE}/notifications`);
          return res.data;
      },
      refetchInterval: 60000 // Poll every minute
  });

  const unreadCount = notifData?.unread_count || 0;
  const notifications = notifData?.items || [];

  // Mark Read Mutation
  const readMutation = useMutation({
      mutationFn: async (id: number | 'all') => {
          return axios.post(`${API_BASE}/notifications/read`, { id });
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
  });
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          
          {/* Logo / Brand */}
          <Text 
            fw={900} 
            size="xl" 
            variant="gradient" 
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            FarmOS
          </Text>
          
          <div style={{ flex: 1 }} />
          
          {/* Right Side Actions */}
          <Group gap="xs">
            {/* NOTIFICATION BELL */}
            <Indicator color="red" disabled={unreadCount === 0} size={10} offset={4}>
                <ActionIcon variant="subtle" size="lg" onClick={openDrawer}>
                    <IconBell size={20} />
                </ActionIcon>
            </Indicator>
            <ThemeToggle />
            
            <Button 
                variant="light" 
                leftSection={<IconUser size={16}/>} 
                visibleFrom="sm"
            >
                {user?.user_display_name}
            </Button>
            
            <ActionIcon variant="subtle" color="red" size="lg" onClick={logout} title="Logout">
                <IconLogout size={20} />
            </ActionIcon>
          </Group>

        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={0}> {/* Padding 0 because sidebar controls its own padding */}
        <Sidebar openCreateModal={openCreateModal} />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>

      {/* NOTIFICATION DRAWER */}
            <Drawer opened={drawerOpened} onClose={closeDrawer} title="Notifications" position="right">
                <Group justify="flex-end" mb="md">
                    <Button variant="subtle" size="xs" onClick={() => readMutation.mutate('all')}>
                        Mark all as read
                    </Button>
                </Group>
                <ScrollArea h="calc(100vh - 100px)">
                    {notifications.length > 0 ? (
                        <Stack gap="xs">
                            {notifications.map((n: any) => (
                                <Paper 
                                    key={n.id} 
                                    p="sm" 
                                    withBorder 
                                    bg={n.status === 'unread' ? 'blue.0' : undefined}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => n.status === 'unread' && readMutation.mutate(n.id)}
                                >
                                    <Group justify="space-between" align="flex-start">
                                        <Text size="sm" fw={500} style={{ flex: 1 }}>{n.message}</Text>
                                        {n.status === 'unread' && <IconCheck size={14} color="blue"/>}
                                    </Group>
                                    <Group justify="space-between" mt="xs">
                                        <Badge size="xs" color={n.type === 'alert' ? 'red' : 'gray'}>{n.type}</Badge>
                                        <Text size="xs" c="dimmed">{new Date(n.trigger_date).toLocaleDateString()}</Text>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        <Text c="dimmed" ta="center">No notifications.</Text>
                    )}
                </ScrollArea>
            </Drawer>
    </AppShell>
  );
}