import { 
    ScrollArea, rem, TextInput, SegmentedControl, Box, Center, 
    UnstyledButton, Text, Select, Divider 
} from '@mantine/core';
import { 
    IconSearch, IconPaw, IconPlus, IconChartBar, IconMenu2,
    IconBuildingWarehouse, IconReceipt2, IconFileAnalytics, 
    IconSettings, IconUsers, IconVaccine
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimalTypes } from '../hooks/useAnimalTypes';
import { LinksGroup } from './NavbarLinksGroup';
import classes from './Sidebar.module.css';

import { getIconComponent } from '../utils/iconMap';

export function Sidebar({ openCreateModal }: { openCreateModal: () => void }) {
  const navigate = useNavigate();
  const [section, setSection] = useState<'menu' | 'livestock'>('menu');
  const { data: types } = useAnimalTypes();

  // Prepare Data for Searchable Select
  const selectData = types?.map(type => ({
      value: String(type.id),
      label: type.title.rendered || type.title.raw
  })) || [];

  // Prepare Top 10 List
  const top10Types = types?.slice(0, 10).map(type => ({
    label: type.title.rendered || type.title.raw,
    icon: getIconComponent(type.farm_icon),
    id: type.id,
    links: [ // Submenu for quick access
        { label: 'Dashboard', link: `/type/${type.id}` },
        { label: 'Animals', link: `/type/${type.id}/list` },
        { label: 'Breeds', link: `/type/${type.id}/breeds` },
    ]
  })) || [];

  // Main Menu Links (Placeholders included as requested)
  const mainMenu = [
      { label: 'Dashboard', icon: IconChartBar, link: '/' },
      { label: 'Animal Types', icon: IconPaw, link: '/types' }, // Link to the list page
      { 
          label: 'Inventory & Resources', 
          icon: IconBuildingWarehouse, 
          links: [
              { label: 'Feeds', link: '/resources/feeds' },
              { label: 'Medicine', link: '/resources/medicine' },
              { label: 'Equipment', link: '/resources/equipment' }
          ]
      },
      { 
          label: 'Health & Vet', 
          icon: IconVaccine, 
          links: [
              { label: 'Vaccination Schedule', link: '/health/vaccinations' },
              { label: 'Treatment Logs', link: '/health/treatments' }
          ]
      },
      { 
          label: 'Financials', 
          icon: IconReceipt2, 
          links: [
              { label: 'Transactions', link: '/finance/transactions' },
              { label: 'Income', link: '/finance/income' },
              { label: 'Expenses', link: '/finance/expenses' }
          ] 
      },
      { 
          label: 'Reports', 
          icon: IconFileAnalytics, 
          links: [
              { label: 'Production', link: '/reports/production' },
              { label: 'Financial', link: '/reports/financial' },
              { label: 'End of Year', link: '/reports/eoy' }
          ] 
      },
      { label: 'Team & Users', icon: IconUsers, link: '/team' },
      { label: 'Settings', icon: IconSettings, link: '/settings' },
  ];

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        {/* Global Search (Ctrl+K) */}
        <TextInput
          placeholder="Global Search..."
          size="xs"
          leftSection={<IconSearch style={{ width: rem(12), height: rem(12) }} stroke={1.5} />}
          mb="sm"
        />

        {/* Tab Switcher */}
        <SegmentedControl
          value={section}
          onChange={(value: any) => setSection(value)}
          transitionTimingFunction="ease"
          fullWidth
          data={[
            {
              value: 'menu',
              label: (
                <Center>
                  <IconMenu2 style={{ width: rem(16), height: rem(16) }} />
                  <Box ml={10} className={classes.tabLabel}>Menu</Box>
                </Center>
              ),
            },
            {
              value: 'livestock',
              label: (
                <Center>
                  <IconPaw style={{ width: rem(16), height: rem(16) }} />
                  <Box ml={10} className={classes.tabLabel}>Livestock</Box>
                </Center>
              ),
            },
          ]}
        />
      </div>

      <ScrollArea className={classes.links} px="sm">
        <div className={classes.linksInner}>
            
            {/* TAB 1: GENERAL MENU */}
            {section === 'menu' && (
                <>
                  {mainMenu.map((item) => (
                      <LinksGroup {...item} key={item.label} /> 
                  ))}
                </>
            )}

            {/* TAB 2: SPECIFIC ANIMALS */}
            {section === 'livestock' && (
                <>
                    {/* Quick Search Dropdown */}
                    <Box mb="md">
                        <Select
                            placeholder="Find Animal Type..."
                            data={selectData}
                            searchable
                            nothingFoundMessage="No types found"
                            onChange={(value) => {
                                if(value) navigate(`/type/${value}`);
                            }}
                            leftSection={<IconSearch size={16} />}
                        />
                    </Box>

                    <Divider label="Quick Access (Top 10)" labelPosition="center" mb="sm" />
                    
                    {top10Types.map((item) => <LinksGroup {...item} key={item.label} />)}
                    
                    <UnstyledButton 
                        onClick={openCreateModal} 
                        className={classes.control} 
                        style={{ 
                            marginTop: '20px',
                            color: 'var(--mantine-color-blue-6)',
                            border: '1px dashed var(--mantine-color-blue-3)',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}
                    >
                        <Center>
                            <IconPlus size={18} />
                            <Text size="sm" ml={5}>Create New Type</Text>
                        </Center>
                    </UnstyledButton>
                </>
            )}
        
        </div>
      </ScrollArea>
    </nav>
  );
}