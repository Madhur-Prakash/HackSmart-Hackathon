import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '../../config';
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { validate, stationIngestSchema, userContextSchema, recommendationRequestSchema } from '../../utils/validation';
import { nowTimestamp, generateId } from '../../utils/helpers';

// Import services
import { processRecommendation } from '../recommendation';
import { getCachedScore } from '../scoring';
import { generateAdminSummary } from '../llm';
import { getCircuitBreakerStatus, fetchAllPredictions } from './externalAI';
import { generateAndSaveQR, deleteQR, getQRRelativePath } from '../recommendation/qrUtil';

// Import data access
import { 
  stationRepository, 
  userRequestRepository, 
  recommendationLogRepository,
  systemEventRepository,
  qrQueueRepository,
  notificationRepository,
  deliveryRepository,
  driverRepository,
  faultTicketRepository,
  checkConnection 
} from '../../db';
import { 
  getJSON, 
  setWithTTL, 
  getTopFromSortedSet, 
  getRedisInfo,
  REDIS_KEYS,
  incrementCounter
} from '../../redis';
import { createProducer, produceMessage, TOPICS } from '../../kafka';
import { 
  StationTelemetry, 
  StationHealth, 
  UserContext, 
  AdminSummary, 
  SystemMetrics,
  QRQueueEntry,
  Delivery,
  FaultTicket,
  Recommendation
} from '../../types';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const logger = createLogger('api-gateway');

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EV Charging Platform API',
      version: '1.0.0',
      description: 'API documentation for the EV Charging Platform',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'API Gateway' },
    ],
  },
  apis: [
    // Only this file for now, can add more as needed
    __filename.replace(/\\/g, '/'),
  ],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Create and configure the main API application
 */

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Health and readiness endpoints
 *   - name: Ingestion
 *     description: Data ingestion endpoints
 *   - name: Recommendation
 *     description: Recommendation endpoints
 *   - name: Admin
 *     description: Admin and metrics endpoints
 */
export function createApiApp(): Application {
  const app = express();

  // CORS - must be first
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: process.env.FRONTEND_URL ? true : false
  }));

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));

  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Request logging
  // app.use((req: Request, res: Response, next: NextFunction) => {
  //   const start = Date.now();
    
  //   res.on('finish', () => {
  //     const duration = Date.now() - start;
  //     logMetrics(logger, 'api.request.latency', duration, {
  //       method: req.method,
  //       path: req.path,
  //       status: res.statusCode.toString(),
  //     });
  //   });
    
  //   next();
  // });

  // ==========================================
  // Health & Status Endpoints
  // ==========================================

  /**
   * @swagger
   * /:
   *   get:
   *     summary: API root - returns service info
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service information
   */
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'EV Charging Platform API',
      version: '1.0.0',
      status: 'running',
      docs: '/docs',
      health: '/health',
      ready: '/ready'
    });
  });

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
  app.get('/health', async (req: Request, res: Response) => {
    const dbHealthy = await checkConnection();
    
    res.json({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        api: 'up',
      },
    });
  });

  app.get('/ready', async (req: Request, res: Response) => {
    const dbHealthy = await checkConnection();
    
    if (dbHealthy) {
      res.json({ ready: true });
    } else {
      res.status(503).json({ ready: false, reason: 'Database not available' });
    }
  });

  // ==========================================
  // Public API Endpoints
  // ==========================================

  // Ingest station telemetry
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
      const validation = validate(stationIngestSchema, req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      const telemetry: StationTelemetry = {
        ...validation.data,
        totalChargers: validation.data.totalChargers || 10,
        maxCapacity: validation.data.maxCapacity || 500,
        timestamp: nowTimestamp(),
      } as StationTelemetry;

      // Initialize producer if not done
      const producer = await createProducer();
      await produceMessage(producer, TOPICS.stationTelemetry, telemetry.stationId, telemetry);

      // Update Redis cache
      await setWithTTL(
        REDIS_KEYS.stationTelemetry(telemetry.stationId),
        telemetry,
        config.redis.ttl.score
      );

      await incrementCounter(REDIS_KEYS.metricsCounter('telemetry_ingested'));

      res.status(202).json({
        success: true,
        message: 'Telemetry ingested',
        stationId: telemetry.stationId,
      });

    } catch (error) {
      next(error);
    }
  });

  // Ingest user context
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
      const validation = validate(userContextSchema, req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      const userContext: UserContext = validation.data;

      // Initialize producer if not done
      const producer = await createProducer();
      await produceMessage(producer, TOPICS.userContext, userContext.userId, userContext);

      // Cache user context
      await setWithTTL(
        REDIS_KEYS.userContext(userContext.userId),
        userContext,
        config.redis.ttl.session
      );

      res.status(202).json({
        success: true,
        message: 'User context ingested',
        userId: userContext.userId,
      });

    } catch (error) {
      next(error);
    }
  });

  // Get recommendations
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
      const startTime = Date.now();
      console.log('runnning api/index.ts recommend GET');

      const request = {
        userId: (req.query.userId as string) || 'anonymous',
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

      const validation = validate(recommendationRequestSchema, request);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      const recommendation = await processRecommendation(validation.data);

      await incrementCounter(REDIS_KEYS.metricsCounter('recommendations_served'));

      res.json({
        success: true,
        data: recommendation,
        meta: {
          processingTime: Date.now() - startTime,
          cacheHit: false,
        },
      });

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
      const startTime = Date.now();

      const validation = validate(recommendationRequestSchema, req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      const recommendation = await processRecommendation(validation.data);

      await incrementCounter(REDIS_KEYS.metricsCounter('recommendations_served'));

      res.json({
        success: true,
        data: recommendation,
        meta: {
          processingTime: Date.now() - startTime,
          cacheHit: false,
        },
      });

    } catch (error) {
      next(error);
    }
  });

  // ==========================================
  // Queue Management Endpoints
  // ==========================================

  /**
   * @swagger
   * /queue/join:
   *   post:
   *     summary: User confirms arrival, QR generated
   *     tags: [Queue]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               stationId:
   *                 type: string
   *               userId:
   *                 type: string
   *     responses:
   *       200:
   *         description: QR code generated
   */
  app.post('/queue/join', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stationId, userId } = req.body;
      if (!stationId || !userId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const qrCode = generateId('QR');
      const now = new Date().toISOString();
      const entry: QRQueueEntry = {
        id: generateId('QUEUE'),
        stationId,
        userId,
        qrCode,
        status: 'waiting',
        joinedAt: now,
      };
      await qrQueueRepository.create(entry);
      await generateAndSaveQR(qrCode);
      const qrImagePath = getQRRelativePath(qrCode);
      res.json({ success: true, qrCode, qrImagePath, entry });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /queue/verify:
   *   post:
   *     summary: Verify QR code and update live queue
   *     tags: [Queue]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               qrCode:
   *                 type: string
   *     responses:
   *       200:
   *         description: QR code verified, queue updated
   */
  app.post('/queue/verify', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qrCode } = req.body;
      if (!qrCode) {
        return res.status(400).json({ success: false, error: 'Missing qrCode' });
      }
      const entry = await qrQueueRepository.findByQRCode(qrCode);
      if (!entry) {
        return res.status(404).json({ success: false, error: 'QR code not found' });
      }
      await qrQueueRepository.updateStatus(entry.id, 'verified');
      deleteQR(qrCode);
      const queue = await qrQueueRepository.findByStation(entry.stationId);
      const busyCount = queue.filter((e: QRQueueEntry) => e.status === 'verified').length;
      res.json({ success: true, entry, busyCount, queue });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /queue/swap:
   *   post:
   *     summary: Mark battery as swapped and dequeue user
   *     tags: [Queue]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               qrCode:
   *                 type: string
   *     responses:
   *       200:
   *         description: User dequeued, live data updated
   */
  app.post('/queue/swap', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qrCode } = req.body;
      if (!qrCode) {
        return res.status(400).json({ success: false, error: 'Missing qrCode' });
      }
      const entry = await qrQueueRepository.findByQRCode(qrCode);
      if (!entry) {
        return res.status(404).json({ success: false, error: 'QR code not found' });
      }
      await qrQueueRepository.updateStatus(entry.id, 'swapped');
      const queue = await qrQueueRepository.findByStation(entry.stationId);
      const busyCount = queue.filter((e: QRQueueEntry) => e.status === 'verified').length;
      res.json({ success: true, entry, busyCount, queue });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================
  // Delivery Management Endpoints
  // ==========================================

  /**
   * @swagger
   * /delivery/alert:
   *   post:
   *     summary: Alert nearby drivers for battery delivery
   *     tags: [Delivery]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Delivery alert sent
   */
  app.post('/delivery/alert', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { batteryId, fromShopId, toStationId } = req.body;
      if (!batteryId || !fromShopId || !toStationId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const deliveryId = generateId('DELIV');
      const now = new Date().toISOString();
      const delivery: Delivery = {
        id: deliveryId,
        batteryId,
        fromShopId,
        toStationId,
        status: 'pending',
        requestedAt: now,
      };
      await deliveryRepository.create(delivery);
      const drivers = await driverRepository.findAll();
      for (const driver of drivers) {
        if (driver.active) {
          await notificationRepository.create({
            id: generateId('NOTIF'),
            userId: driver.id,
            type: 'delivery',
            message: `New delivery available from shop ${fromShopId} to station ${toStationId}`,
            read: false,
            createdAt: now,
          });
        }
      }
      res.json({ success: true, delivery, message: 'Delivery alert sent to drivers.' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /delivery/accept:
   *   post:
   *     summary: Driver accepts a delivery
   *     tags: [Delivery]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Delivery accepted
   */
  app.post('/delivery/accept', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deliveryId, driverId } = req.body;
      if (!deliveryId || !driverId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const delivery = await deliveryRepository.findById(deliveryId);
      if (!delivery) {
        return res.status(404).json({ success: false, error: 'Delivery not found' });
      }
      if (delivery.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Delivery already accepted or completed' });
      }
      delivery.assignedDriverId = driverId;
      delivery.status = 'accepted';
      delivery.acceptedAt = new Date().toISOString();
      await deliveryRepository.updateStatus(deliveryId, 'accepted');
      await notificationRepository.create({
        id: generateId('NOTIF'),
        userId: 'admin',
        type: 'delivery',
        message: `Driver ${driverId} accepted delivery ${deliveryId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      res.json({ success: true, delivery, message: 'Delivery accepted and admin notified.' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /delivery/confirm:
   *   post:
   *     summary: Confirm delivery completion (admin)
   *     tags: [Delivery]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Delivery confirmed
   */
  app.post('/delivery/confirm', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deliveryId } = req.body;
      if (!deliveryId) {
        return res.status(400).json({ success: false, error: 'Missing deliveryId' });
      }
      const delivery = await deliveryRepository.findById(deliveryId);
      if (!delivery) {
        return res.status(404).json({ success: false, error: 'Delivery not found' });
      }
      delivery.status = 'delivered';
      delivery.deliveredAt = new Date().toISOString();
      await deliveryRepository.updateStatus(deliveryId, 'delivered');
      if (delivery.assignedDriverId) {
        await notificationRepository.create({
          id: generateId('NOTIF'),
          userId: delivery.assignedDriverId,
          type: 'delivery',
          message: `Delivery ${deliveryId} marked as delivered by admin`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      res.json({ success: true, delivery, message: 'Delivery confirmed and driver notified.' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /admin/deliveries:
   *   get:
   *     summary: Get all deliveries (admin)
   *     tags: [Delivery]
   *     responses:
   *       200:
   *         description: List of deliveries
   */
  app.get('/admin/deliveries', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deliveries = await deliveryRepository.findAll();
      res.json({ success: true, deliveries });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /driver/{driverId}/deliveries:
   *   get:
   *     summary: Get all deliveries for a driver
   *     tags: [Delivery]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of deliveries for driver
   */
  app.get('/driver/:driverId/deliveries', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const deliveries = await deliveryRepository.findByDriver(driverId);
      res.json({ success: true, deliveries });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================
  // Fault & Ticket Management Endpoints
  // ==========================================

  /**
   * @swagger
   * /ticket/manual:
   *   post:
   *     summary: Manually raise a fault ticket
   *     tags: [Fault]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Ticket created
   */
  app.post('/ticket/manual', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stationId, reportedBy, faultLevel, description } = req.body;
      if (!stationId || !reportedBy || !faultLevel || !description) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const ticketId = generateId('TICKET');
      const now = new Date().toISOString();
      const ticket: FaultTicket = {
        id: ticketId,
        stationId,
        reportedBy,
        faultLevel,
        description,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      };
      await faultTicketRepository.create(ticket);
      await notificationRepository.create({
        id: generateId('NOTIF'),
        userId: 'admin',
        type: 'ticket',
        message: `Manual ticket raised at station ${stationId}: ${description}`,
        read: false,
        createdAt: now,
      });
      res.json({ success: true, ticket, message: 'Ticket raised and admin notified.' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /fault/report:
   *   post:
   *     summary: Report a station fault
   *     tags: [Fault]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Fault reported
   */
  app.post('/fault/report', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stationId, reportedBy, faultLevel, description } = req.body;
      if (!stationId || !reportedBy || !faultLevel || !description) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const ticketId = generateId('TICKET');
      const now = new Date().toISOString();
      const ticket: FaultTicket = {
        id: ticketId,
        stationId,
        reportedBy,
        faultLevel,
        description,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      };
      let ticketCreated = false;
      if (faultLevel === 'critical') {
        await faultTicketRepository.create(ticket);
        ticketCreated = true;
        await notificationRepository.create({
          id: generateId('NOTIF'),
          userId: 'admin',
          type: 'ticket',
          message: `Critical fault reported at station ${stationId}: ${description}`,
          read: false,
          createdAt: now,
        });
      }
      res.json({
        success: true,
        ticketCreated,
        ticket: ticketCreated ? ticket : undefined,
        message: ticketCreated ? 'Critical fault, ticket raised and admin notified.' : 'Fault reported.',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /admin/tickets:
   *   get:
   *     summary: Get all fault tickets (admin)
   *     tags: [Fault]
   *     responses:
   *       200:
   *         description: List of tickets
   */
  app.get('/admin/tickets', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tickets = await faultTicketRepository.findAll();
      res.json({ success: true, tickets });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================
  // Additional Recommendation Endpoints
  // ==========================================

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
        meta: { cacheHit: true },
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
   *             properties:
   *               stationId:
   *                 type: string
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
      res.json({ success: true, message: 'Selection recorded' });
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
   *             properties:
   *               rating:
   *                 type: number
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
      res.json({ success: true, message: 'Feedback recorded' });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================
  // Internal / Admin API Endpoints
  // ==========================================

  // Get station score
  /**
   * @swagger
   * /station/{id}/score:
   *   get:
   *     summary: Get station score
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Station score
   */
  app.get('/station/:id/score', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const score = await getCachedScore(id);
      
      if (!score) {
        return res.status(404).json({
          success: false,
          error: 'Score not found',
          message: 'No score data available for this station',
        });
      }

      res.json({
        success: true,
        data: score,
        meta: {
          timestamp: nowTimestamp(),
          freshness: 'cached',
        },
      });

    } catch (error) {
      next(error);
    }
  });

  // Get station health
  /**
   * @swagger
   * /station/{id}/health:
   *   get:
   *     summary: Get station health
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Station health
   */
  app.get('/station/:id/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const health = await getJSON<StationHealth>(REDIS_KEYS.stationHealth(id));
      
      if (!health) {
        return res.status(404).json({
          success: false,
          error: 'Health data not found',
        });
      }

      res.json({
        success: true,
        data: health,
      });

    } catch (error) {
      next(error);
    }
  });

  // Get station predictions
  app.get('/station/:id/predictions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const predictions = await fetchAllPredictions(id);

      res.json({
        success: true,
        data: predictions,
      });

    } catch (error) {
      next(error);
    }
  });

  // Admin summary
  /**
   * @swagger
   * /admin/summary:
   *   get:
   *     summary: Get admin summary
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Admin summary
   */
  app.get('/admin/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get station counts
      const allStations = await stationRepository.findAll();
      const totalStations = allStations.length;

      // Get top stations
      const topRanked = await getTopFromSortedSet(REDIS_KEYS.stationRanking, 10);
      
      // Calculate stats
      const recommendationsToday = await recommendationLogRepository.getCountToday();
      const avgResponseTime = await userRequestRepository.getAverageProcessingTime();

      // Build summary data
      const summaryData = {
        totalStations,
        operationalStations: Math.floor(totalStations * 0.9), // Simulated
        degradedStations: Math.floor(totalStations * 0.08),
        avgScore: topRanked.length > 0 
          ? topRanked.reduce((sum, s) => sum + s.score, 0) / topRanked.length 
          : 0,
        topStations: topRanked.slice(0, 5).map(s => {
          const station = allStations.find(st => st.id === s.member);
          return {
            stationId: s.member,
            name: station?.name || s.member,
            score: s.score,
          };
        }),
        alertCount: 0,
      };

      // Generate LLM summary
      const llmSummary = await generateAdminSummary(summaryData);

      const summary: AdminSummary = {
        totalStations: summaryData.totalStations,
        operationalStations: summaryData.operationalStations,
        degradedStations: summaryData.degradedStations,
        offlineStations: totalStations - summaryData.operationalStations - summaryData.degradedStations,
        totalActiveUsers: 0, // Would track via sessions
        recommendationsToday,
        avgResponseTime,
        cacheHitRatio: 0.85, // Would calculate from metrics
        topStations: summaryData.topStations.map(s => ({
          stationId: s.stationId,
          name: s.name,
          recommendationCount: 0, // Would aggregate from logs
        })),
        systemHealth: summaryData.operationalStations / totalStations > 0.9 ? 'healthy' : 'degraded',
      };

      res.json({
        success: true,
        data: summary,
        narrative: llmSummary,
      });

    } catch (error) {
      next(error);
    }
  });

  // System metrics
  /**
   * @swagger
   * /admin/metrics:
   *   get:
   *     summary: Get system metrics
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: System metrics
   */
  app.get('/admin/metrics', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redisInfo = await getRedisInfo();
      const circuitStatus = getCircuitBreakerStatus();

      const metrics: SystemMetrics = {
        kafka: {
          consumerLag: 0, // Would get from Kafka admin
          messagesPerSecond: 0,
          topicStats: {},
        },
        redis: {
          hitRatio: 0.85,
          memoryUsage: parseInt(redisInfo.used_memory || '0', 10),
          connectedClients: parseInt(redisInfo.connected_clients || '0', 10),
        },
        api: {
          requestsPerSecond: 0,
          avgLatency: await userRequestRepository.getAverageProcessingTime(),
          errorRate: 0.01,
        },
        services: {
          api: { status: 'up', lastHeartbeat: new Date().toISOString(), uptime: process.uptime() },
          database: { status: await checkConnection() ? 'up' : 'down', lastHeartbeat: new Date().toISOString(), uptime: 0 },
          externalAI: { status: (await circuitStatus).status === 'closed' ? 'up' : 'degraded', lastHeartbeat: new Date().toISOString(), uptime: 0 },
        },
      };

      res.json({
        success: true,
        data: metrics,
      });

    } catch (error) {
      next(error);
    }
  });

  // List all stations
  /**
   * @swagger
   * /admin/stations:
   *   get:
   *     summary: List all stations
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: List of stations
   */
  app.get('/admin/stations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stations = await stationRepository.findAll();
      
      res.json({
        success: true,
        data: stations,
        count: stations.length,
      });

    } catch (error) {
      next(error);
    }
  });

  // Get system events
  /**
   * @swagger
   * /admin/events:
   *   get:
   *     summary: Get system events
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: System events
   */
  app.get('/admin/events', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const severity = req.query.severity as string;
      
      const events = severity 
        ? await systemEventRepository.findBySeverity(severity, limit)
        : await systemEventRepository.findRecent(limit);
      
      res.json({
        success: true,
        data: events,
        count: events.length,
      });

    } catch (error) {
      next(error);
    }
  });

  // ==========================================
  // Error Handling
  // ==========================================

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
      path: req.path,
    });
  });

  // Global error handler
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('API error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });

    // Log to database
    systemEventRepository.create({
      eventType: 'api_error',
      severity: 'error',
      message: error.message,
      metadata: {
        path: req.path,
        method: req.method,
        stack: error.stack,
      },
      sourceService: 'api',
    }).catch(() => {}); // Don't fail if logging fails

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: config.env === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

/**
 * Start the API gateway server
 */
async function start(): Promise<void> {
  try {
    const app = createApiApp();
    const port = config.ports.api;

    app.listen(port, () => {
      logger.info(`API Gateway started on port ${port}`);
      
      // Log startup event
      systemEventRepository.create({
        eventType: 'service_start',
        severity: 'info',
        message: `API Gateway started on port ${port}`,
        metadata: { port, env: config.env },
        sourceService: 'api',
      }).catch(() => {});
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      await systemEventRepository.create({
        eventType: 'service_stop',
        severity: 'info',
        message: `API Gateway shutting down (${signal})`,
        sourceService: 'api',
      }).catch(() => {});

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start API Gateway', { error });
    process.exit(1);
  }
}

// Export for testing

// Start if run directly
if (require.main === module) {
  start();
}
