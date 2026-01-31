import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
// ...existing code...
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { generateId, nowTimestamp } from '../../utils/helpers';
import { validate, recommendationRequestSchema } from '../../utils/validation';
import { optimizeForRequest, applyUserPreferences } from '../optimization';
import { runModel } from '../../utils/modelRunner';
import { config } from '../../config';
import { generateExplanation, ExplanationContext } from '../llm';
import { userRequestRepository, recommendationLogRepository } from '../../db';
import { setWithTTL, getJSON, REDIS_KEYS } from '../../redis';
import { 
  RecommendationRequest, 
  Recommendation, 
  RecommendationResponse,
  RankedStation 
} from '../../types';

const logger = createLogger('recommendation-service');

/**
 * Process recommendation request
 */
async function processRecommendation(
  request: RecommendationRequest
): Promise<Recommendation> {
  const startTime = Date.now();
  const requestId = generateId('REQ');

  logger.info('Processing recommendation request', { 
    requestId, 
    userId: request.userId,
    location: request.location 
  });

  // Create user request record
  const requestRecordId = await userRequestRepository.create({
    userId: request.userId,
    sessionId: generateId('SES'),
    request,
  });

  try {
    // Get optimized stations
    let rankedStations = await optimizeForRequest(request);

    // Integrate admin-facing models for operational intelligence
    const trafficPrediction = await runModel(config.models.trafficForecast, request);
    const microTraffic = await runModel(config.models.microTraffic, request);
    const batteryRebalance = await runModel(config.models.batteryRebalance, request);
    const stockOrder = await runModel(config.models.stockOrder, request);
    const staffDiversion = await runModel(config.models.staffDiversion, request);
    const tieupStorage = await runModel(config.models.tieupStorage, request);
    const customerArrival = await runModel(config.models.customerArrival, request);
    const batteryDemand = await runModel(config.models.batteryDemand, request);

    // Attach predictions to recommendation response
    rankedStations = rankedStations.map(station => ({
      ...station,
      trafficPrediction,
      microTraffic,
      batteryRebalance,
      stockOrder,
      staffDiversion,
      tieupStorage,
      customerArrival,
      batteryDemand,
    }));

    // Apply any user preferences (if we had user profile data)
    rankedStations = applyUserPreferences(rankedStations, {
      preferFast: request.preferredChargerType === 'fast',
      preferNearby: true,
    });

    // Generate explanation using LLM
    const explanationContext: ExplanationContext = {
      userRequest: request,
      topStation: rankedStations[0],
      alternatives: rankedStations.slice(1, 3),
      totalCandidates: rankedStations.length,
      trafficPrediction,
      microTraffic,
      batteryRebalance,
      stockOrder,
      staffDiversion,
      tieupStorage,
      customerArrival,
      batteryDemand,
    };

    const explanation = await generateExplanation(explanationContext);

    // Create recommendation response
    const recommendation: Recommendation = {
      requestId,
      userId: request.userId,
      recommendations: rankedStations,
      explanation,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
    };

    // Update request record
    const processingTime = Date.now() - startTime;
    await userRequestRepository.updateResponse(requestRecordId, recommendation, processingTime);

    // Log recommendation
    await recommendationLogRepository.create({
      requestId,
      userId: request.userId,
      stationIds: rankedStations.map(s => s.stationId),
      metadata: {
        processingTime,
        location: request.location,
        limit: request.limit,
      },
    });

    // Cache recommendation
    await setWithTTL(
      `recommendation:${requestId}`,
      recommendation,
      300 // 5 minutes
    );

    logMetrics(logger, 'recommendation.latency', processingTime, { userId: request.userId });
    logEvent(logger, 'recommendation_generated', {
      requestId,
      stationCount: rankedStations.length,
      topStation: rankedStations[0]?.stationId,
    });

    return recommendation;

  } catch (error) {
    await userRequestRepository.markFailed(requestRecordId, (error as Error).message);
    throw error;
  }
}

/**
 * Create Express application for recommendation service
 */
/**
 * @swagger
 * tags:
 *   - name: Recommendation
 *     description: Recommendation endpoints
 *   - name: Health
 *     description: Health endpoints
 */
function createApp(): Application {
  const app = express();
  app.use(express.json());

  // Swagger setup
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Recommendation Service API',
        version: '1.0.0',
        description: 'API documentation for the Recommendation Service',
      },
      servers: [
        { url: 'http://localhost:3005', description: 'Recommendation Service' },
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
    res.json({ 
      status: 'healthy', 
      service: 'recommendation', 
      timestamp: new Date().toISOString() 
    });
  });

  /**
   * @swagger
   * /recommend:
   *   get:
   *     summary: Get recommendations
   *     tags: [Recommendation]
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: lat
   *         schema:
   *           type: number
   *       - in: query
   *         name: lon
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Recommendation response
   */
  app.get('/recommend', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse query parameters
      console.log('runnning recommendation/index.ts recommend GET');
      const request: RecommendationRequest = {
        userId: req.query.userId as string || 'anonymous',
        location: {
          latitude: parseFloat(req.query.lat as string),
          longitude: parseFloat(req.query.lon as string),
        },
        vehicleType: req.query.vehicleType as string,
        batteryLevel: req.query.batteryLevel ? parseFloat(req.query.batteryLevel as string) : undefined,
        preferredChargerType: req.query.chargerType as 'fast' | 'standard' | 'any',
        maxWaitTime: req.query.maxWaitTime ? parseInt(req.query.maxWaitTime as string) : undefined,
        maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 5,
      };

      // Validate
      const validation = validate(recommendationRequestSchema, request);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      const startTime = Date.now();
      const recommendation = await processRecommendation(request);

      const response: RecommendationResponse = {
        success: true,
        data: recommendation,
        meta: {
          processingTime: Date.now() - startTime,
          cacheHit: false,
        },
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /recommend:
   *   post:
   *     summary: Get recommendations (POST)
   *     tags: [Recommendation]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Recommendation response
   */
  app.post('/recommend', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = validate(recommendationRequestSchema, req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      const startTime = Date.now();
      const recommendation = await processRecommendation(validation.data);

      const response: RecommendationResponse = {
        success: true,
        data: recommendation,
        meta: {
          processingTime: Date.now() - startTime,
          cacheHit: false,
        },
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /recommend/{requestId}:
   *   get:
   *     summary: Get cached recommendation
   *     tags: [Recommendation]
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Cached recommendation
   */
  app.get('/recommend/:requestId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.params;
      const cached = await getJSON<Recommendation>(`recommendation:${requestId}`);

      if (!cached) {
        return res.status(404).json({
          success: false,
          error: 'Recommendation not found or expired',
        });
      }

      res.json({
        success: true,
        data: cached,
        meta: {
          cacheHit: true,
        },
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /recommend/{requestId}/select:
   *   post:
   *     summary: Record station selection
   *     tags: [Recommendation]
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Selection recorded
   */
  app.post('/recommend/:requestId/select', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.params;
      const { stationId } = req.body;

      if (!stationId) {
        return res.status(400).json({
          success: false,
          error: 'stationId is required',
        });
      }

      await recommendationLogRepository.recordSelection(requestId, stationId);

      logEvent(logger, 'station_selected', { requestId, stationId });

      res.json({
        success: true,
        message: 'Selection recorded',
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /recommend/{requestId}/feedback:
   *   post:
   *     summary: Record feedback
   *     tags: [Recommendation]
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Feedback recorded
   */
  app.post('/recommend/:requestId/feedback', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.params;
      const { rating } = req.body;

      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'rating must be a number between 1 and 5',
        });
      }

      await recommendationLogRepository.recordFeedback(requestId, rating);

      logEvent(logger, 'feedback_recorded', { requestId, rating });

      res.json({
        success: true,
        message: 'Feedback recorded',
      });

    } catch (error) {
      next(error);
    }
  });

  // Error handler
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Recommendation error', { 
      error: error.message, 
      stack: error.stack,
      path: req.path 
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: config.env === 'development' ? error.message : undefined,
    });
  });

  return app;
}

/**
 * Start the recommendation service
 */
async function start(): Promise<void> {
  try {
    const app = createApp();
    const port = config.ports.recommendation;

    app.listen(port, () => {
      logger.info(`Recommendation service started on port ${port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('Shutting down recommendation service');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('Shutting down recommendation service');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start recommendation service', { error });
    process.exit(1);
  }
}

// Export for testing and use by API gateway
export { createApp, processRecommendation };

// Start if run directly
if (require.main === module) {
  start();
}
