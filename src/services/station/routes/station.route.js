import e, { Router } from "express";
import { createStation } from "../controllers/station.controller.js";
import { CompanyJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/station/create:
 *   post:
 *     tags:
 *       - Station
 *     summary: Create a new charging station
 *     description: Creates a station under a company and assigns it to a regional admin. Requires a valid `access_token` cookie for a company user.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStationBody'
 *     responses:
 *       201:
 *         description: Station created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or invalid company/regional-admin mapping
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized — missing or invalid access_token cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Company or regional admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Duplicate station name for this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/create").post(CompanyJWTVerify, createStation)

export default router