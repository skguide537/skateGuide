import { ErrorCode, ErrorSeverity, StatusCode } from '@/types/enums';
import { AppError } from '@/types/error-models';
import { logger } from './logger';
import { useCallback } from 'react';

export class ErrorHandler {
    /**
     * Create a standardized error with both technical and user messages
     */
    static createError(
        code: ErrorCode,
        severity: ErrorSeverity,
        technicalMessage: string,
        userMessage: string,
        details?: any
    ): AppError {
        return {
            code,
            severity,
            technicalMessage,
            userMessage,
            timestamp: new Date(),
            shouldRetry: true,
            showRetryToUser: severity === ErrorSeverity.HIGH,
            details
        };
    }

    /**
     * Handle API errors and convert them to standardized AppError format
     */
    static handleApiError(error: any, context?: string): AppError {
        // Handle HttpError instances (from skateparkClient)
        if (error.name === 'HttpError' && error.response?.status) {
            const status = error.response.status;
            
            if (status === StatusCode.BadRequest) {
                return this.createError(
                    ErrorCode.VALIDATION_ERROR,
                    ErrorSeverity.MEDIUM,
                    `API validation error: ${error.message || 'Bad request'}`,
                    'The information you provided needs some adjustments. Please check and try again.',
                    { status, originalError: error }
                );
            }
            
            if (status === StatusCode.Unauthorized) {
                return this.createError(
                    ErrorCode.AUTHENTICATION_FAILED,
                    ErrorSeverity.MEDIUM,
                    `Authentication failed: ${error.message || 'Unauthorized'}`,
                    'You need to log in to do that. Please sign in and try again.',
                    { status, originalError: error }
                );
            }
            
            if (status === StatusCode.Forbidden) {
                return this.createError(
                    ErrorCode.PERMISSION_DENIED,
                    ErrorSeverity.MEDIUM,
                    `Permission denied: ${error.message || 'Forbidden'}`,
                    'You don\'t have permission to do that. Please contact support if you think this is a mistake.',
                    { status, originalError: error }
                );
            }
            
            if (status === StatusCode.NotFound) {
                return this.createError(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    ErrorSeverity.MEDIUM,
                    `Resource not found: ${error.message || 'Not found'}`,
                    'We couldn\'t find what you\'re looking for. Please check the details and try again.',
                    { status, originalError: error }
                );
            }
            
            if (status >= StatusCode.InternalServerError) {
                // Try to extract more specific error information from HttpError
                let errorMessage = error.message || 'Internal server error';
                let userMessage = 'Something went wrong on our end. We\'ll retry automatically.';
                
                if (error.response?.data) {
                    const errorData = error.response.data;
                    
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                    
                    if (errorData.error) {
                        // Provide more specific user messages based on error type
                        switch (errorData.error.toLowerCase()) {
                            case 'database connection failed':
                            case 'database timeout':
                                userMessage = 'Our database is having issues. We\'re working to fix this and will retry automatically.';
                                break;
                            case 'file upload service unavailable':
                            case 'cloudinary service is currently down':
                                userMessage = 'Our file upload service is temporarily unavailable. We\'ll retry automatically.';
                                break;
                            case 'service unavailable':
                                userMessage = 'One of our services is temporarily down. We\'ll retry automatically.';
                                break;
                            default:
                                userMessage = 'We\'re experiencing technical difficulties. We\'ll retry automatically.';
                        }
                    }
                }
                
                return this.createError(
                    ErrorCode.EXTERNAL_SERVICE_ERROR,
                    ErrorSeverity.HIGH,
                    `Server error ${status}: ${errorMessage}`,
                    userMessage,
                    { status, originalError: error, context }
                );
            }
        }

        // Handle HTTP status-based errors (legacy support)
        if (error.response?.status) {
            const status = error.response.status;
            
            if (status === StatusCode.BadRequest) {
                return this.createError(
                    ErrorCode.VALIDATION_ERROR,
                    ErrorSeverity.MEDIUM,
                    `API validation error: ${error.message || 'Bad request'}`,
                    'The information you provided needs some adjustments. Please check and try again.',
                    { status, originalError: error }
                );
            }
            
            if (status === StatusCode.Unauthorized) {
                return this.createError(
                    ErrorCode.AUTHENTICATION_FAILED,
                    ErrorSeverity.MEDIUM,
                    `Authentication failed: ${error.message || 'Unauthorized'}`,
                    'You need to log in to do that. Please sign in and try again.',
                    { status, originalError: error }
                );
            }
            
            if (status === StatusCode.Forbidden) {
                return this.createError(
                    ErrorCode.PERMISSION_DENIED,
                    ErrorSeverity.MEDIUM,
                    `Permission denied: ${error.message || 'Forbidden'}`,
                    'You don\'t have permission to do that. Please contact support if you think this is a mistake.',
                    { status, originalError: error }
                );
            }
            
            if (status === StatusCode.NotFound) {
                return this.createError(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    ErrorSeverity.MEDIUM,
                    `Resource not found: ${error.message || 'Not found'}`,
                    'We couldn\'t find what you\'re looking for. Please check the details and try again.',
                    { status, originalError: error }
                );
            }
            
            if (status >= StatusCode.InternalServerError) {
                // Try to extract more specific error information
                let errorMessage = 'Internal server error';
                let userMessage = 'Something went wrong on our end. We\'ll retry automatically.';
                
                if (error.response?.data) {
                    try {
                        const errorData = typeof error.response.data === 'string' 
                            ? JSON.parse(error.response.data) 
                            : error.response.data;
                        
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                        
                        if (errorData.error) {
                            // Provide more specific user messages based on error type
                            switch (errorData.error.toLowerCase()) {
                                case 'database connection failed':
                                case 'database timeout':
                                    userMessage = 'Our database is having issues. We\'re working to fix this and will retry automatically.';
                                    break;
                                case 'file upload service unavailable':
                                case 'cloudinary service is currently down':
                                    userMessage = 'Our file upload service is temporarily unavailable. We\'ll retry automatically.';
                                    break;
                                case 'service unavailable':
                                    userMessage = 'One of our services is temporarily down. We\'ll retry automatically.';
                                    break;
                                default:
                                    userMessage = 'We\'re experiencing technical difficulties. We\'ll retry automatically.';
                            }
                        }
                    } catch (parseError) {
                        // If we can't parse the error data, use the raw response
                        if (error.response.data) {
                            errorMessage = error.response.data;
                        }
                    }
                }
                
                return this.createError(
                    ErrorCode.EXTERNAL_SERVICE_ERROR,
                    ErrorSeverity.HIGH,
                    `Server error ${status}: ${errorMessage}`,
                    userMessage,
                    { status, originalError: error, context }
                );
            }
        }

        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return this.createError(
                ErrorCode.NETWORK_ERROR,
                ErrorSeverity.MEDIUM,
                `Network error: ${error.message}`,
                'We\'re having trouble connecting. Please check your internet and try again.',
                { originalError: error }
            );
        }

        // Handle validation errors
        if (error.name === 'ValidationError' || error.name === 'BadRequestError') {
            return this.createError(
                ErrorCode.VALIDATION_ERROR,
                ErrorSeverity.MEDIUM,
                `Validation error: ${error.message}`,
                'The information you provided needs some adjustments. Please check and try again.',
                { originalError: error }
            );
        }

        // Handle authentication errors
        if (error.name === 'AuthenticationError') {
            return this.createError(
                ErrorCode.AUTHENTICATION_FAILED,
                ErrorSeverity.MEDIUM,
                `Authentication error: ${error.message}`,
                'You need to log in to do that. Please sign in and try again.',
                { originalError: error }
            );
        }

        // Default unknown error - provide more context
        const contextInfo = context ? ` in ${context}` : '';
        return this.createError(
            ErrorCode.UNKNOWN_ERROR,
            ErrorSeverity.MEDIUM,
            `Unexpected error${contextInfo}: ${error.message || 'An unknown error occurred'}`,
            'Something unexpected happened. We\'ll retry automatically, but if this persists, please contact support.',
            { originalError: error, context }
        );
    }

    /**
     * Log error using the existing logger with enhanced context
     */
    static logError(error: AppError, context?: string): void {
        // Don't create a new Error object - let the logger handle the timestamp formatting
        // Just pass the error message and enhanced context
        logger.error(
            error.technicalMessage,
            undefined, // No Error object needed
            { 
                component: context || 'ErrorHandler',
                errorCode: error.code,
                severity: error.severity,
                details: error.details
            }
        );
    }

    /**
     * Get user-friendly retry message based on severity
     */
    static getRetryMessage(severity: ErrorSeverity): string {
        switch (severity) {
            case ErrorSeverity.LOW:
                return 'Retrying...';
            case ErrorSeverity.MEDIUM:
                return 'We\'re having trouble with that. Let me try again...';
            case ErrorSeverity.HIGH:
                return 'We\'re having trouble with that. Let me try again...';
            default:
                return 'Retrying...';
        }
    }

    /**
     * Check if an error should be retried
     */
    static shouldRetry(error: AppError): boolean {
        // Don't retry validation or permission errors
        if (error.code === ErrorCode.VALIDATION_ERROR || 
            error.code === ErrorCode.PERMISSION_DENIED) {
            return false;
        }
        
        return error.shouldRetry;
    }

    /**
     * Get the appropriate color for error severity (for UI components)
     */
    static getSeverityColor(severity: ErrorSeverity): 'info' | 'warning' | 'error' {
        switch (severity) {
            case ErrorSeverity.LOW:
                return 'info';
            case ErrorSeverity.MEDIUM:
                return 'warning';
            case ErrorSeverity.HIGH:
                return 'error';
            default:
                return 'error';
        }
    }

    /**
     * Get the appropriate icon for error severity (for UI components)
     */
    static getSeverityIcon(severity: ErrorSeverity): string {
        switch (severity) {
            case ErrorSeverity.LOW:
                return 'ℹ️';
            case ErrorSeverity.MEDIUM:
                return '⚠️';
            case ErrorSeverity.HIGH:
                return '🚨';
            default:
                return '❌';
        }
    }

    /**
     * Clear error state - can be used by components to reset error state
     */
    static clearError(): void {
        // This is a utility method for components to use
        // Components can call this to clear their error state
        // The actual clearing is done by the component's setError(null)
    }
}
