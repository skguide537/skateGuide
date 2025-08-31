import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography, 
    Box,
    Alert
} from '@mui/material';
import { AppError } from '@/types/error-models';
import { ErrorHandler } from '@/utils/errorHandler';

interface ErrorModalProps {
    error: AppError | null;
    open: boolean;
    onClose: () => void;
    onRetry?: () => void;
    title?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ 
    error, 
    open, 
    onClose, 
    onRetry,
    title 
}) => {
    if (!error) return null;

    // Use shared utility for consistent error display

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        }
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{ErrorHandler.getSeverityIcon(error.severity)}</span>
                {title || 'Something went wrong'}
            </DialogTitle>
            
            <DialogContent>
                <Alert 
                    severity={ErrorHandler.getSeverityColor(error.severity) as any}
                    sx={{ mb: 2 }}
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

                {process.env.NODE_ENV === 'development' && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
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
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
                
                {onRetry && error.shouldRetry && (
                    <Button 
                        onClick={handleRetry} 
                        variant="contained" 
                        color="primary"
                    >
                        Try Again
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
