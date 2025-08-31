'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface StatusIndicatorsProps {
    totalSpots: number;
    filteredSpots: number;
    lastUpdated: Date;
    onRefresh: () => void;
}

export default function StatusIndicators({ totalSpots, filteredSpots, lastUpdated, onRefresh }: StatusIndicatorsProps) {
    return (
        <>
            {/* Last Updated Indicator */}
            <Box sx={{ 
                textAlign: 'center', 
                mb: 4,
                p: 2,
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%)'
            }}>
                <Typography variant="body2" color="var(--color-text-secondary)" fontWeight={500}>
                    🔄 Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
            </Box>

            {/* Virtual Scrolling Status */}
            <Box sx={{ 
                textAlign: 'center', 
                mt: 4, 
                mb: 4,
                p: 3,
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%)'
            }}>
                <Typography variant="body2" color="var(--color-text-secondary)" fontWeight={500}>
                    🚀 Virtual scrolling enabled • {filteredSpots} of {totalSpots} spots loaded
                </Typography>
            </Box>
        </>
    );
}
