import React from 'react';
import { ErrorState } from './ErrorState';
import { ErrorHandler } from '@/utils/errorHandler';
import { ErrorCode, ErrorSeverity } from '@/types/enums';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log the error using our ErrorHandler
        const appError = ErrorHandler.createError(
            ErrorCode.UNKNOWN_ERROR,
            ErrorSeverity.HIGH,
            `React component error: ${error.message}`,
            'Something went wrong with this section. Please refresh the page.',
            { errorInfo, stack: error.stack }
        );
        
        ErrorHandler.logError(appError, 'ErrorBoundary');
        
        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error!} />;
            }

            // Default error state
            const appError = ErrorHandler.createError(
                ErrorCode.UNKNOWN_ERROR,
                ErrorSeverity.HIGH,
                `Component crashed: ${this.state.error?.message || 'Unknown error'}`,
                'Something went wrong with this section. Please refresh the page.',
                { stack: this.state.error?.stack }
            );

            return (
                <ErrorState
                    error={appError}
                    onRetry={() => window.location.reload()}
                    showDetails={process.env.NODE_ENV === 'development'}
                />
            );
        }

        return this.props.children;
    }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<{ error: Error }>
) {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
