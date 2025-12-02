import React from 'react';
import { 
    IconPaw, IconFish, IconEgg, IconMilk, IconSeeding, 
    IconTractor, IconBug, IconHorse, IconPig 
} from '@tabler/icons-react';
import { FaGithub, FaCrow, FaDog, FaCat, FaHippo, FaDove } from 'react-icons/fa6';
import { GiGoat, GiChicken, GiDuck, GiCow, GiSheep, GiPig, GiRabbit } from 'react-icons/gi';


// The Master List of Available Icons
// Keys are what we save in DB. Values are the Components.
export const ICON_MAP: Record<string, React.ElementType> = {
    // Generics (Tabler)
    'paw': IconPaw,
    'fish': IconFish,
    'egg': IconEgg,
    'milk': IconMilk,
    'plant': IconSeeding,
    'tractor': IconTractor,
    'bug': IconBug,
    'horse': IconHorse,
    'pig': IconPig,

    // Specifics (FontAwesome / GameIcons via React-Icons)
    'rabbit': GiRabbit,
    'chicken': GiChicken,
    'cow': GiCow,
    'goat': GiGoat,
    'sheep': GiSheep,
    'duck': GiDuck,
    'dog': FaDog,
    'cat': FaCat,
    'bird': FaCrow,
    'dove': FaDove,
};

// Helper to get component from string
export const getIconComponent = (iconName: string | undefined) => {
    if (!iconName || !ICON_MAP[iconName]) return IconPaw; // Default
    return ICON_MAP[iconName];
};

// Data for the Select Dropdown
export const iconSelectData = Object.keys(ICON_MAP).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
    icon: key // Used for custom rendering
}));