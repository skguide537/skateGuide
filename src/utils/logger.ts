/**
 * Centralized logging utility for the SkateGuide application
 * Provides environment-based control over logging levels and future extensibility
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  timestamp?: Date;
  [key: string]: any;
}

export class Logger {
  private logLevel: LogLevel;
  private enableConsoleLogging: boolean;
  private enableFileLogging: boolean;
  private enableErrorTracking: boolean;
  private errorLog: Array<{
    level: LogLevel;
    message: string;
    error?: Error;
    context?: LogContext;
    timestamp: Date;
  }> = [];

  constructor() {
    // Set log level based on environment
    this.logLevel = this.getLogLevelFromEnvironment();
    this.enableConsoleLogging = process.env.NODE_ENV !== 'production';
    this.enableFileLogging = false; // Future feature
    this.enableErrorTracking = true; // Always track errors for debugging
  }

  /**
   * Get log level from environment variables
   */
  private getLogLevelFromEnvironment(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    
    switch (envLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default:
        // Default based on environment
        return process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO;
    }
  }

  /**
   * Check if a log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    const timestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    const levelStr = `[${level.toUpperCase()}]`;
    const contextStr = context?.component ? `[${context.component}]` : '';
    
    return `${timestamp} ${levelStr}${contextStr}: ${message}`;
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const logEntry = {
      level: LogLevel.ERROR,
      message,
      error,
      context,
      timestamp: new Date()
    };

    // Add to error log for tracking
    if (this.enableErrorTracking) {
      this.errorLog.push(logEntry);
    }

    // Console logging
    if (this.enableConsoleLogging) {
      const formattedMessage = this.formatMessage('ERROR', message, context);
      if (error) {
        console.error(formattedMessage, error);
      } else {
        console.error(formattedMessage);
      }
    }

    // Future: File logging, remote logging, etc.
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    if (this.enableConsoleLogging) {
      const formattedMessage = this.formatMessage('WARN', message, context);
      console.warn(formattedMessage);
    }
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    if (this.enableConsoleLogging) {
      const formattedMessage = this.formatMessage('INFO', message, context);
      console.log(formattedMessage);
    }
  }

  /**
   * Log debug messages
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    if (this.enableConsoleLogging) {
      const formattedMessage = this.formatMessage('DEBUG', message, context);
      console.log(formattedMessage);
    }
  }

  /**
   * Log trace messages (most verbose)
   */
  trace(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.TRACE)) return;

    if (this.enableConsoleLogging) {
      const formattedMessage = this.formatMessage('TRACE', message, context);
      console.log(formattedMessage);
    }
  }

  /**
   * Set log level dynamically
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable/disable console logging
   */
  setConsoleLogging(enabled: boolean): void {
    this.enableConsoleLogging = enabled;
  }

  /**
   * Get error log for debugging/monitoring
   */
  getErrorLog(): Array<{
    level: LogLevel;
    message: string;
    error?: Error;
    context?: LogContext;
    timestamp: Date;
  }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get current log level
   */
  getCurrentLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Check if logging is enabled for a specific level
   */
  isLoggingEnabled(level: LogLevel): boolean {
    return this.shouldLog(level);
  }
}

// Export singleton instance for easy use
export const logger = new Logger();

// Export individual methods for convenience
export const { error, warn, info, debug, trace } = logger;
