// Simple logger implementation that works without external dependencies
// This avoids the need for the winston package

import fs from 'fs';
import path from 'path';

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

interface LoggerInterface {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

// Simplified logger that doesn't require winston
class SimpleLogger implements LoggerInterface {
  private logDir: string;
  
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }
  
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create log directory:', error);
      }
    }
  }
  
  private logToConsole(level: LogLevel, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
    
    console.log(logEntry);
    
    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile(level, logEntry);
    }
  }
  
  private writeToFile(level: LogLevel, logEntry: string): void {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = level === 'error' ? `error-${date}.log` : `app-${date}.log`;
      const filepath = path.join(this.logDir, filename);
      
      fs.appendFileSync(filepath, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  error(message: string, meta?: any): void {
    this.logToConsole('error', message, meta);
  }
  
  warn(message: string, meta?: any): void {
    this.logToConsole('warn', message, meta);
  }
  
  info(message: string, meta?: any): void {
    this.logToConsole('info', message, meta);
  }
  
  http(message: string, meta?: any): void {
    this.logToConsole('http', message, meta);
  }
  
  debug(message: string, meta?: any): void {
    // Only log debug in development
    if (process.env.NODE_ENV !== 'production') {
      this.logToConsole('debug', message, meta);
    }
  }
}

// Create and export logger instance
export const logger = new SimpleLogger();

// Export default interface for compatibility
export default {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
}; 