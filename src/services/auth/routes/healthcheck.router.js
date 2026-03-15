import { Router } from 'express';
import { AuthHealthCheck } from "../controllers/healthcheck.controller.js"

const router = Router();

/**
 * @swagger
 * /api/v1/auth/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Auth service health check
 *     description: Returns a 200 OK response if the auth service is running.
 *     responses:
 *       200:
 *         description: Auth service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/health').get(AuthHealthCheck);

export default router