// Simple logger implementation that works without external dependencies
// This avoids the need for the winston package

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
  private logToConsole(level: LogLevel, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    
    console.log(`${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`);
    
    // Also save to file in a production environment
    if (process.env.NODE_ENV === 'production') {
      // In a real implementation, we would write to a file here
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
    this.logToConsole('debug', message, meta);
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