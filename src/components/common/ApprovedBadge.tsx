'use client';

import { Chip } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Box } from '@mui/material';

interface ApprovedBadgeProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'chip' | 'icon';
  sx?: any;
}

/**
 * Reusable badge component to indicate a park is approved
 * Can be used in modal, full page, or anywhere else
 */
export default function ApprovedBadge({ 
  size = 'small', 
  variant = 'chip',
  sx = {} 
}: ApprovedBadgeProps) {
  if (variant === 'icon') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          color: 'var(--color-accent-green)',
          ...sx
        }}
      >
        <VerifiedIcon 
          fontSize={size === 'small' ? 'small' : size === 'medium' ? 'medium' : 'large'} 
          sx={{ 
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
            fontSize: size === 'large' ? '2rem' : undefined,
          }} 
        />
      </Box>
    );
  }

  // Chip component only supports 'small' | 'medium', so map 'large' to 'medium'
  const chipSize = size === 'large' ? 'medium' : size;
  
  return (
    <Chip
      icon={<VerifiedIcon />}
      label="Approved"
      size={chipSize}
      sx={{
        backgroundColor: 'var(--color-accent-green)',
        color: 'var(--color-surface-elevated)',
        fontWeight: 700,
        ...(size === 'large' && {
          fontSize: '1rem',
          height: '36px',
          '& .MuiChip-icon': {
            fontSize: '1.25rem',
          },
        }),
        '& .MuiChip-icon': {
          color: 'var(--color-surface-elevated)',
        },
        ...sx
      }}
    />
  );
}

