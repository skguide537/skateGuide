'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { GeolocationFailureReason } from '@/hooks/useGeolocation';

interface LocationFallbackBannerProps {
    reason?: GeolocationFailureReason;
    onRetry: () => void;
    isRetrying?: boolean;
}

export function LocationFallbackBanner({ reason, onRetry, isRetrying = false }: LocationFallbackBannerProps) {
    const reasonText = reason === 'denied'
        ? 'Permission denied.'
        : reason === 'timeout'
            ? 'Request timed out.'
            : undefined;

    return (
        <Box
            sx={{
                mb: 3,
                p: 2.5,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        We couldn&apos;t determine your location. Showing popular parks instead.
                    </Typography>
                    {reasonText && (
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mt: 0.5 }}>
                            {reasonText} You can retry enabling location anytime.
                        </Typography>
                    )}
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onRetry}
                    disabled={isRetrying}
                    sx={{ whiteSpace: 'nowrap' }}
                >
                    {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
            </Stack>
        </Box>
    );
}

