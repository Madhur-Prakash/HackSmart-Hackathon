import { Router } from 'express';
import { AuthHealthCheck } from "../controllers/healthcheck.controller.js"

const router = Router();

router.route('/health').get(AuthHealthCheck);

export default router