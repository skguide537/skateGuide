'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Chip, OutlinedInput } from '@mui/material';
import { SEARCH_FILTER_STYLES } from '@/constants/searchFilters';

export type SelectionMode = 'single' | 'multiple' | 'exclusive';

export interface FilterOption {
    value: string;
    label: string;
    exclusive?: boolean; // For options that should clear others when selected
}

interface FilterSelectProps {
    label: string;
    value: string[];
    onChange: (values: string[]) => void;
    options: FilterOption[];
    selectionMode: SelectionMode;
    placeholder?: string;
    sx?: any;
}

export default function FilterSelect({ 
    label, 
    value, 
    onChange, 
    options, 
    selectionMode, 
    placeholder,
    sx 
}: FilterSelectProps) {
    
    const handleChange = (event: any) => {
        const selectedValues = event.target.value;
        

        
        switch (selectionMode) {
            case 'single':
                // Single selection: one option or none
                if (selectedValues === '') {
                    onChange([]);
                } else {
                    onChange([selectedValues]);
                }
                break;
                
            case 'multiple':
                // Multiple selection: can select multiple options
                onChange(selectedValues);
                break;
                
            case 'exclusive':
                // Exclusive selection: can select 2-3 options
                if (selectedValues.length > 3) {
                    onChange(selectedValues.slice(0, 3));
                    return;
                }
                onChange(selectedValues);
                break;
        }
    };

    const getDisplayValue = () => {
        if (value.length === 0) {
            // For multiple and exclusive modes, return empty array to allow selection
            if (selectionMode === 'multiple' || selectionMode === 'exclusive') {
                return [];
            }
            // For single mode, return empty string to show placeholder
            return '';
        }
        return value;
    };

    const renderValue = (selected: any) => {
        if (selectionMode === 'single') {
            // Handle single selection - selected could be string or array
            if (!selected || (Array.isArray(selected) && selected.length === 0)) {
                return placeholder || `Select ${label}`;
            }
            // If it's an array, take first item; if it's a string, use it directly
            return Array.isArray(selected) ? selected[0] : selected;
        }
        
        // For multiple and exclusive modes, show chips
        // Ensure selected is always an array and handle edge cases
        const selectedArray = Array.isArray(selected) ? selected : [selected];
        
        // Filter out any invalid values
        const validValues = selectedArray.filter(value => value);
        
        if (validValues.length === 0) {
            return placeholder || `Select ${label}`;
        }
        
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {validValues.map((value: string) => (
                    <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        sx={{ 
                            backgroundColor: 'var(--color-primary)',
                            color: 'white'
                        }}
                    />
                ))}
            </Box>
        );
    };

    const isMultiple = selectionMode !== 'single';

    return (
        <Box sx={{ flex: 1, minWidth: 0, ...sx }}>
            <FormControl fullWidth>
                <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>
                    {label}
                </InputLabel>
                <Select
                    multiple={isMultiple}
                    value={getDisplayValue()}
                    onChange={handleChange}
                    input={isMultiple ? <OutlinedInput label={label} /> : undefined}
                    renderValue={isMultiple ? renderValue : undefined}
                    sx={SEARCH_FILTER_STYLES.sortControl}
                >
                    
                    {options.map((option) => (
                        <MenuItem 
                            key={option.value} 
                            value={option.value}
                            sx={{ color: 'var(--color-text-primary)' }}
                        >
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
