import { Router } from 'express';
import { AuthHealthCheck } from "../controllers/healthcheck.controller.js"

const router = Router();

router.route('/api/v1/auth/health').get(AuthHealthCheck);

export default router