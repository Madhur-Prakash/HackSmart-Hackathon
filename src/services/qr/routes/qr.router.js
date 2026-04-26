import { Router } from "express";
import { generateQr, getQrImage, verifyQr } from "../controllers/qr.controller.js";

const router = Router();

/**
 * @swagger
 * /api/v1/qr/generate:
 *   post:
 *     tags:
 *       - QR
 *     summary: Generate a QR token and PNG image
 *     description: Stores payload in Redis with TTL and creates a QR image that can be fetched using token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateQrBody'
 *     responses:
 *       201:
 *         description: QR generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid request payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/generate", generateQr);

/**
 * @swagger
 * /api/v1/qr/image/{token}:
 *   get:
 *     tags:
 *       - QR
 *     summary: Get QR PNG image by token
 *     description: Returns the generated QR image if token has not expired.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: QR token
 *     responses:
 *       200:
 *         description: PNG image returned
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: QR not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/image/:token", getQrImage);

/**
 * @swagger
 * /api/v1/qr/verify/{token}:
 *   get:
 *     tags:
 *       - QR
 *     summary: Verify QR token and retrieve payload
 *     description: Reads data from Redis. Returns 410 when token expired or invalid. Deletes token after successful verification (one-time use).
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: QR token
 *     responses:
 *       200:
 *         description: QR verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       410:
 *         description: QR expired or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/verify/:token", verifyQr);

export default router;
