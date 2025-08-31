import { AppError } from '@/types/error-models';
import { Alert, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { ErrorHandler } from '@/utils/errorHandler';

interface ErrorStateProps {
    error: AppError;
    onRetry?: () => void;
    className?: string;
    showDetails?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
    error, 
    onRetry, 
    className = '',
    showDetails = false 
}) => {
   

    return (
        <Box className={`error-state ${className}`} sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>
                    {ErrorHandler.getSeverityIcon(error.severity)}
                </Typography>
            </Box>

            <Alert 
                severity={ErrorHandler.getSeverityColor(error.severity) as any}
                sx={{ mb: 2, textAlign: 'left' }}
            >
                <Typography variant="body1" sx={{ mb: 1 }}>
                    {error.userMessage}
                </Typography>
                
                {error.showRetryToUser && (
                    <Typography variant="body2" color="text.secondary">
                        We'll automatically retry this operation.
                    </Typography>
                )}
            </Alert>

            {onRetry && error.shouldRetry && (
                <Button
                    variant="contained"
                    onClick={onRetry}
                    sx={{ mt: 2 }}
                >
                    Try Again
                </Button>
            )}

            {showDetails && process.env.NODE_ENV === 'development' && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary">
                        <strong>Technical Details:</strong> {error.technicalMessage}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                        <strong>Error Code:</strong> {error.code}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                        <strong>Severity:</strong> {error.severity}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
