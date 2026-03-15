import { Router } from 'express';
import { UserHealthCheck } from "../controllers/healthcheck.controller.js"

const router = Router();

/**
 * @swagger
 * /api/v1/user/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: User service health check
 *     description: Returns a 200 OK response if the user profile service is running.
 *     responses:
 *       200:
 *         description: User service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/health').get(UserHealthCheck);

export default router