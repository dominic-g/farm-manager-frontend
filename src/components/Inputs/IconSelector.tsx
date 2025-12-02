import React from 'react'
import { Select, Group, Text, ThemeIcon } from '@mantine/core';
import type { ComboboxItem, OptionsFilter } from '@mantine/core';
import { getIconComponent, iconSelectData } from '../../utils/iconMap';

interface Props {
    value: string;
    onChange: (value: string | null) => void;
    label?: string;
    error?: string;
}

// Custom render for the selected item and dropdown items
const renderSelectOption = ({ option, checked }: { option: ComboboxItem; checked?: boolean }) => {
    const Icon = getIconComponent(option.value);
    return (
        <Group flex="1" gap="xs">
            <ThemeIcon variant="light" size="sm" color="blue">
                <Icon size={14} />
            </ThemeIcon>
            <Text size="sm">{option.label}</Text>
            {checked && <Text size="xs" c="blue">✓</Text>}
        </Group>
    );
};

export function IconSelector({ value, onChange, label, error }: Props) {
    return (
        <Select
            label={label || "Select Icon"}
            placeholder="Search icon (e.g. Rabbit)"
            data={iconSelectData}
            value={value}
            onChange={onChange}
            searchable
            clearable
            renderOption={renderSelectOption}
            leftSectionPointerEvents="none"
            leftSection={
                value ? (
                    <ThemeIcon variant="transparent" size="sm">
                        {React.createElement(getIconComponent(value), { size: 16 })}
                    </ThemeIcon>
                ) : null
            }
            error={error}
        />
    );
}