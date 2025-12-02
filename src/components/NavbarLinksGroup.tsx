import { useState } from 'react';
import { Group, Box, Collapse, ThemeIcon, Text, UnstyledButton, rem } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import classes from './NavbarLinksGroup.module.css';

interface LinksGroupProps {
  icon: React.FC<any>;
  label: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
  id?: number; // Special ID for Animal Types
  link?: string; 
}

export function LinksGroup({ icon: Icon, label, initiallyOpened, links, id, link }: LinksGroupProps) {
  const navigate = useNavigate();
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);

  const handleClick = () => {
      // Scenario 1: It has submenus (e.g., Inventory)
      if (hasLinks) {
          setOpened((o) => !o); // Toggle collapse
          
          // Special Case: Animal Types have a submenu BUT clicking the header should also go to Dashboard
          if (id) {
              navigate(`/type/${id}`);
          }
          return;
      }

      // Scenario 2: It is a standalone link (e.g., Global Dashboard)
      if (link) {
          navigate(link);
      }
  };

  const items = (hasLinks ? links : []).map((subLink) => (
    <Text<'a'>
      component="a"
      className={classes.link}
      href={subLink.link}
      key={subLink.label}
      onClick={(event) => {
        event.preventDefault();
        navigate(subLink.link);
      }}
    >
      {subLink.label}
    </Text>
  ));

  return (
    <>
      <UnstyledButton onClick={handleClick} className={classes.control}>
        <Group justify="space-between" gap={0}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeIcon variant="light" size={30} color="blue">
              <Icon style={{ width: rem(18), height: rem(18) }} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <IconChevronRight
              className={classes.chevron}
              stroke={1.5}
              style={{
                width: rem(16),
                height: rem(16),
                transform: opened ? 'rotate(-90deg)' : 'none',
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      
      {hasLinks ? (
          <Collapse in={opened}>
              <div className={classes.submenu}>
                  {items}
              </div>
          </Collapse>
      ) : null}
    </>
  );
}