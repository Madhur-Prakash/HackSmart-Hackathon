import { Router } from 'express';
import { StationHealthCheck } from '../controllers/healthcheck.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/station/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Station service health check
 *     description: Returns a 200 OK response if the station service is running.
 *     responses:
 *       200:
 *         description: Station service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/').get(StationHealthCheck);

export default router