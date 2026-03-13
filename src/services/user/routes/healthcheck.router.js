import { Router } from 'express';
import { UserHealthCheck } from "../controllers/healthcheck.controller.js"

const router = Router();

router.route('/health').get(UserHealthCheck);

export default router