import { AppShell, Burger, Group, Text, Button, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../Sidebar';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { ThemeToggle } from '../ThemeToggle'; // Import the toggle

interface Props {
    children: React.ReactNode;
    openCreateModal: () => void;
}

export function MainLayout({ children, openCreateModal }: Props) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { user, logout } = useAuth();

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
    </AppShell>
  );
}