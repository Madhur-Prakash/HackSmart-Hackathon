import { config } from './config';
import { createLogger } from './utils/logger';
import { createApiApp } from './services/api';
import { runMigrations } from './db';
import { createTopics } from './kafka';
import { getRedisClient, closeRedis } from './redis';
import { closeDb, systemEventRepository } from './db';

const logger = createLogger('main');

/**
 * Initialize all services and start the application
 */
async function bootstrap(): Promise<void> {
  logger.info('Starting EV Charging Platform Backend', {
    env: config.env,
    version: '1.0.0',
  });

  try {
    // Initialize Redis connection
    logger.info('Connecting to Redis...');
    getRedisClient();
    logger.info('Redis connected');

    // Run database migrations
    logger.info('Running database migrations...');
    await runMigrations();
    logger.info('Database migrations complete');

    // Create Kafka topics
    logger.info('Setting up Kafka topics...');
    try {
      await createTopics();
      logger.info('Kafka topics ready');
    } catch (kafkaError) {
      logger.warn('Kafka setup skipped (broker may not be available)', { error: kafkaError });
    }

    // Start API Gateway
    const app = createApiApp();
    const port = config.ports.api;

    const server = app.listen(port, () => {
      logger.info(`🚀 EV Charging Platform API running on port ${port}`);
      logger.info(`📊 Health check: http://localhost:${port}/health`);
      logger.info(`📍 Recommendations: http://localhost:${port}/recommend`);
      logger.info(`🔧 Admin dashboard: http://localhost:${port}/admin/summary`);

      // Log startup event
      systemEventRepository.create({
        eventType: 'system_start',
        severity: 'info',
        message: 'EV Charging Platform Backend started successfully',
        metadata: {
          port,
          env: config.env,
          version: '1.0.0',
        },
        sourceService: 'main',
      }).catch(() => {});
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // Log shutdown event
      await systemEventRepository.create({
        eventType: 'system_stop',
        severity: 'info',
        message: `System shutting down (${signal})`,
        sourceService: 'main',
      }).catch(() => {});

      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close connections
      await closeRedis();
      await closeDb();

      logger.info('Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

// Start the application
bootstrap();
