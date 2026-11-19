/**
 * Centralized logging utility with environment-based control
 * Replaces scattered console statements throughout the codebase
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;
  private isTest: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isTest = process.env.NODE_ENV === 'test';

    // Set logging level based on environment
    if (this.isTest) {
      this.currentLevel = LogLevel.ERROR; // Only errors in tests
    } else if (this.isDevelopment) {
      this.currentLevel = LogLevel.DEBUG; // All logs in development
    } else {
      this.currentLevel = LogLevel.WARN; // Warnings and errors in production
    }

    // Allow override via environment variable
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel) {
      const numericLevel = parseInt(envLevel, 10);
      if (!isNaN(numericLevel) && numericLevel >= 0 && numericLevel <= 4) {
        this.currentLevel = numericLevel as LogLevel;
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context
    };
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, data, context);
    
    // In development, use console methods for better debugging
    if (this.isDevelopment) {
      const consoleMethod = this.getConsoleMethod(level);
      if (data) {
        consoleMethod(`[${entry.timestamp}] ${context ? `[${context}] ` : ''}${message}`, data);
      } else {
        consoleMethod(`[${entry.timestamp}] ${context ? `[${context}] ` : ''}${message}`);
      }
    } else {
      // In production, use structured logging
      console.log(JSON.stringify(entry));
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Debug level logging - detailed information for debugging
   */
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info level logging - general information
   */
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning level logging - something unexpected happened
   */
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error level logging - error occurred
   */
  error(message: string, data?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Set logging level at runtime
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Get current logging level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Check if a level would be logged
   */
  isLevelEnabled(level: LogLevel): boolean {
    return this.shouldLog(level);
  }

  /**
   * Create a logger with a specific context
   * Returns a new logger instance that automatically includes the context
   */
  withContext(context: string): Logger {
    const contextLogger = new Logger();
    contextLogger.currentLevel = this.currentLevel;
    contextLogger.isDevelopment = this.isDevelopment;
    contextLogger.isTest = this.isTest;
    
    // Override the log method to include context
    const originalLog = contextLogger.log.bind(contextLogger);
    contextLogger.log = (level: LogLevel, message: string, data?: any, contextOverride?: string) => {
      originalLog(level, message, data, contextOverride || context);
    };
    
    return contextLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const { debug, info, warn, error } = logger;

// Export context logger factory
export const createLogger = (context: string) => logger.withContext(context);
