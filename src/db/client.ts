import knex, { Knex } from 'knex';
import { config } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

// Database client singleton
let dbInstance: Knex | null = null;

/**
 * Get or create database client instance
 */
export function getDb(): Knex {
  if (!dbInstance) {
    dbInstance = knex({
      client: 'pg',
      connection: {
        host: config.postgres.host,
        port: config.postgres.port,
        user: config.postgres.user,
        password: config.postgres.password,
        database: config.postgres.database,
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
      },
      acquireConnectionTimeout: 10000,
      debug: config.env === 'development',
    });

    logger.info('Database client initialized', {
      host: config.postgres.host,
      database: config.postgres.database,
    });
  }

  return dbInstance;
}

/**
 * Close database connection
 */
export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    logger.info('Database connection closed');
  }
}

/**
 * Check database connection
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database connection check failed', { error });
    return false;
  }
}

/**
 * Table names
 */
export const TABLES = {
  stations: 'stations',
  stationHistory: 'station_history',
  userRequests: 'user_requests',
  recommendationLogs: 'recommendation_logs',
  systemEvents: 'system_events',
  users: 'users',
  faultTickets: 'fault_tickets',
  deliveries: 'deliveries',
  notifications: 'notifications',
  qrQueue: 'qr_queue',
  drivers: 'drivers',
} as const;
