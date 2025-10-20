// Logging utility with support for different levels and formats

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export class Logger {
  private level: LogLevel;
  private format: 'json' | 'text';

  constructor(level: LogLevel = LogLevel.INFO, format: 'json' | 'text' = 'json') {
    this.level = level;
    this.format = format;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatEntry(entry: LogEntry): string {
    if (this.format === 'json') {
      return JSON.stringify(entry);
    }

    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase();
    const message = entry.message;
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? `\n${entry.error.stack || entry.error.message}` : '';

    return `[${timestamp}] ${level}: ${message}${context}${error}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

// Global logger instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  (process.env.LOG_FORMAT as 'json' | 'text') || 'json'
);
