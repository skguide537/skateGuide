'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Verified, VerifiedUser } from '@mui/icons-material';

interface ApprovedFilterProps {
    showOnlyApproved: boolean;
    onShowOnlyApprovedChange: (show: boolean) => void;
}

export default function ApprovedFilter({ showOnlyApproved, onShowOnlyApprovedChange }: ApprovedFilterProps) {
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': {
                    backgroundColor: 'var(--color-surface-elevated)',
                }
            }}
            onClick={() => onShowOnlyApprovedChange(!showOnlyApproved)}
        >
            {showOnlyApproved ? (
                <Verified sx={{ color: 'var(--color-accent-green)' }} />
            ) : (
                <VerifiedUser sx={{ color: 'var(--color-text-secondary)' }} />
            )}
            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                Show Only Approved
            </Typography>
        </Box>
    );
}

