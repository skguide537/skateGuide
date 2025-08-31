import { ErrorCode, ErrorSeverity } from './enums';

export interface AppError {
    code: ErrorCode;
    severity: ErrorSeverity;
    technicalMessage: string;  // For logger.error (developer)
    userMessage: string;       // For users (generic)
    timestamp: Date;
    shouldRetry: boolean;
    showRetryToUser: boolean;
    details?: any;
}

/**
 * Custom error classes for different error types
 */
export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class ExternalServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExternalServiceError';
    }
}

/**
 * Custom HTTP error class that preserves response data
 */
export class HttpError extends Error {
    public response: {
        status: number;
        data?: any;
    };

    constructor(
        message: string,
        status: number,
        responseData?: any,
        public originalError?: any
    ) {
        super(message);
        this.name = 'HttpError';
        
        // Preserve the response data for error handling
        this.response = {
            status,
            data: responseData
        };
    }
} 