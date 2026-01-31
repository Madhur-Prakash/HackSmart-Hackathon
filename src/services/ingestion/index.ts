import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { createProducer, TOPICS, produceMessage, disconnectKafka } from '../../kafka';
import { setWithTTL, REDIS_KEYS } from '../../redis';
import { config } from '../../config';
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { validate, stationTelemetrySchema, stationHealthSchema, gridStatusSchema, userContextSchema } from '../../utils/validation';
import { nowTimestamp } from '../../utils/helpers';
import { StationTelemetry, StationHealth, GridStatus, UserContext } from '../../types';
import { Producer } from 'kafkajs';

const logger = createLogger('ingestion-service');
let producer: Producer;

/**
 * Initialize Kafka producer
 */
async function initializeProducer(): Promise<void> {
  producer = await createProducer();
  logger.info('Ingestion service producer initialized');
}

/**
 * Ingest station telemetry data
 */
async function ingestStationTelemetry(data: Partial<StationTelemetry>): Promise<void> {
  const startTime = Date.now();
  
  // Add timestamp if not present
  const telemetry: StationTelemetry = {
    ...data,
    timestamp: data.timestamp || nowTimestamp(),
  } as StationTelemetry;

  // Validate
  const validation = validate(stationTelemetrySchema, telemetry);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  // Publish to Kafka
  await produceMessage(producer, TOPICS.stationTelemetry, telemetry.stationId, telemetry);

  // Cache in Redis for quick access
  await setWithTTL(
    REDIS_KEYS.stationTelemetry(telemetry.stationId),
    telemetry,
    config.redis.ttl.score
  );

  const duration = Date.now() - startTime;
  logMetrics(logger, 'ingestion.telemetry.latency', duration, { stationId: telemetry.stationId });
  logEvent(logger, 'telemetry_ingested', { stationId: telemetry.stationId });
}

/**
 * Ingest station health data
 */
async function ingestStationHealth(data: StationHealth): Promise<void> {
  const startTime = Date.now();

  const validation = validate(stationHealthSchema, data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  await produceMessage(producer, TOPICS.stationHealth, data.stationId, data);
  
  await setWithTTL(
    REDIS_KEYS.stationHealth(data.stationId),
    data,
    config.redis.ttl.score
  );

  const duration = Date.now() - startTime;
  logMetrics(logger, 'ingestion.health.latency', duration, { stationId: data.stationId });
}

/**
 * Ingest grid status data
 */
async function ingestGridStatus(data: GridStatus): Promise<void> {
  const startTime = Date.now();

  const validation = validate(gridStatusSchema, data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  await produceMessage(producer, TOPICS.gridStatus, data.gridId, data);
  
  await setWithTTL(
    REDIS_KEYS.gridStatus(data.gridId),
    data,
    config.redis.ttl.score
  );

  const duration = Date.now() - startTime;
  logMetrics(logger, 'ingestion.grid.latency', duration, { gridId: data.gridId });
}

/**
 * Ingest user context data
 */
async function ingestUserContext(data: UserContext): Promise<void> {
  const startTime = Date.now();

  const validation = validate(userContextSchema, data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  await produceMessage(producer, TOPICS.userContext, data.userId, data);
  
  await setWithTTL(
    REDIS_KEYS.userContext(data.userId),
    data,
    config.redis.ttl.session
  );

  const duration = Date.now() - startTime;
  logMetrics(logger, 'ingestion.user.latency', duration, { userId: data.userId });
}


/**
 * @swagger
 * tags:
 *   - name: Ingestion
 *     description: Data ingestion endpoints
 *   - name: Health
 *     description: Health endpoints
 */
function createApp(): Application {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Swagger setup
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Ingestion Service API',
        version: '1.0.0',
        description: 'API documentation for the Ingestion Service',
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Ingestion Service' },
      ],
    },
    apis: [__filename.replace(/\\/g, '/')],
  };
  const swaggerSpec = swaggerJSDoc(swaggerOptions);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service health
   */
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'ingestion', timestamp: new Date().toISOString() });
  });

  /**
   * @swagger
   * /ingest/station:
   *   post:
   *     summary: Ingest station telemetry
   *     tags: [Ingestion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       202:
   *         description: Telemetry ingested
   */
  app.post('/ingest/station', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestStationTelemetry(req.body);
      res.status(202).json({ success: true, message: 'Telemetry ingested' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /ingest/station/batch:
   *   post:
   *     summary: Batch ingest station telemetry
   *     tags: [Ingestion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       202:
   *         description: Batch ingested
   */
  app.post('/ingest/station/batch', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stations } = req.body as { stations: StationTelemetry[] };
      if (!Array.isArray(stations)) {
        return res.status(400).json({ error: 'stations must be an array' });
      }
      const results = await Promise.allSettled(
        stations.map(s => ingestStationTelemetry(s))
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      res.status(202).json({ 
        success: true, 
        message: 'Batch ingested',
        stats: { succeeded, failed, total: stations.length }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /ingest/health:
   *   post:
   *     summary: Ingest station health
   *     tags: [Ingestion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       202:
   *         description: Health data ingested
   */
  app.post('/ingest/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestStationHealth(req.body);
      res.status(202).json({ success: true, message: 'Health data ingested' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /ingest/grid:
   *   post:
   *     summary: Ingest grid status
   *     tags: [Ingestion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       202:
   *         description: Grid status ingested
   */
  app.post('/ingest/grid', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestGridStatus(req.body);
      res.status(202).json({ success: true, message: 'Grid status ingested' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /ingest/user-context:
   *   post:
   *     summary: Ingest user context
   *     tags: [Ingestion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       202:
   *         description: User context ingested
   */
  app.post('/ingest/user-context', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestUserContext(req.body);
      res.status(202).json({ success: true, message: 'User context ingested' });
    } catch (error) {
      next(error);
    }
  });

  // Error handler
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Ingestion error', { error: error.message, path: req.path });
    res.status(500).json({ 
      error: 'Ingestion failed', 
      message: error.message 
    });
  });

  return app;
}

/**
 * Start the ingestion service
 */
async function start(): Promise<void> {
  try {
    await initializeProducer();
    
    const app = createApp();
    const port = config.ports.ingestion;

    app.listen(port, () => {
      logger.info(`Ingestion service started on port ${port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Shutting down ingestion service');
      await disconnectKafka(producer);
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('Shutting down ingestion service');
      await disconnectKafka(producer);
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start ingestion service', { error });
    process.exit(1);
  }
}

// Export for testing
export { createApp, ingestStationTelemetry, ingestStationHealth, ingestGridStatus, ingestUserContext };

// Start if run directly
if (require.main === module) {
  start();
}
