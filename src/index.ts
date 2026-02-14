import { config } from './config';
import { createLogger } from './utils/logger';
import { createApiApp } from './services/api';
import { runMigrations, seedDatabase } from './db';
import { ensureTopics } from './kafka';
import { getRedisClient, closeRedis } from './redis';
import { closeDb, systemEventRepository } from './db';
import { startFeaturesConsumer } from './services/features';
import { startScoringConsumer } from './services/scoring';

const logger = createLogger('main');

// Store cleanup functions for graceful shutdown
const cleanupFunctions: Array<() => Promise<void>> = [];

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

    // Seed database with initial data
    logger.info('Seeding database...');
    await seedDatabase();
    logger.info('Database seeding complete');

    // Ensure Kafka topics exist before starting consumers
    logger.info('Setting up Kafka topics...');
    try {
      await ensureTopics();
      logger.info('Kafka topics ready');
    } catch (kafkaError) {
      logger.warn('Kafka setup skipped (broker may not be available)', { error: kafkaError });
    }

    // Start Kafka consumers for features and scoring
    logger.info('Starting Kafka consumers...');
    try {
      const featuresCleanup = await startFeaturesConsumer();
      cleanupFunctions.push(featuresCleanup);
      logger.info('Features consumer started');

      const scoringCleanup = await startScoringConsumer();
      cleanupFunctions.push(scoringCleanup);
      logger.info('Scoring consumer started');
    } catch (consumerError) {
      logger.warn('Kafka consumers skipped (broker may not be available)', { error: consumerError });
    }

    // Start API Gateway
    const app = createApiApp();
    const port = config.ports.api;

    const server = app.listen(port, () => {
      logger.info(`🚀 EV Charging Platform API running on port ${port}`);
      logger.info(`📊 Health check: http://localhost:${port}/health`);
      logger.info(`📍 Recommendations: http://localhost:${port}/recommend`);
      logger.info(`🔧 Admin dashboard: http://localhost:${port}/admin/summary`);
      logger.info(`📑 API Docs: http://localhost:${port}/docs`);

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

      // Close Kafka consumers
      logger.info('Closing Kafka consumers...');
      for (const cleanup of cleanupFunctions) {
        try {
          await cleanup();
        } catch (err) {
          logger.warn('Error during cleanup', { error: err });
        }
      }

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
