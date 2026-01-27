import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, service, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${service || 'app'}] ${level}: ${message} ${metaStr}`;
});

// Create logger factory
export function createLogger(service: string): winston.Logger {
  const formats = [
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format((info) => ({ ...info, service }))(),
  ];

  if (config.env === 'development') {
    formats.push(colorize(), devFormat);
  } else {
    formats.push(json());
  }

  return winston.createLogger({
    level: config.logging.level,
    format: combine(...formats),
    transports: [
      new winston.transports.Console(),
      // Add file transport for production
      ...(config.env === 'production' ? [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 10485760,
          maxFiles: 10,
        }),
      ] : []),
    ],
    defaultMeta: { service },
  });
}

// Default logger instance
export const logger = createLogger('app');

// Structured logging helpers
export const logMetrics = (logger: winston.Logger, name: string, value: number, tags?: Record<string, string>) => {
  logger.info('metric', { metricName: name, value, tags, type: 'metric' });
};

export const logEvent = (logger: winston.Logger, event: string, data?: Record<string, unknown>) => {
  logger.info('event', { eventName: event, data, type: 'event' });
};

export const logError = (logger: winston.Logger, error: Error, context?: Record<string, unknown>) => {
  logger.error('error', { 
    errorMessage: error.message, 
    stack: error.stack, 
    context,
    type: 'error' 
  });
};
