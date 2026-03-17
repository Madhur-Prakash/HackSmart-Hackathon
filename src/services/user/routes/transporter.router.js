import { Router } from "express";
import {
    updateAccountDetails,
    updateTransporterProfile,
    updateUserAvatar
} from "../controllers/transporter.controller.js";
import {upload} from "../../../middlewares/multer.middleware.js"
import { TransporterJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/user/transporter/update_account_details:
 *   patch:
 *     tags:
 *       - User — Transporter
 *     summary: Update transporter account details
 *     description: Updates basic account info (email, bio, phone, gender, date of birth). Note — `gender` and `dateOfBirth` can only be set once. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePersonalAccountDetailsBody'
 *     responses:
 *       200:
 *         description: Transporter details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or attempt to change immutable field
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
 */
router.route("/update_account_details").patch(TransporterJWTVerify, updateAccountDetails)

/**
 * @swagger
 * /api/v1/user/transporter/update_avatar:
 *   patch:
 *     tags:
 *       - User — Transporter
 *     summary: Update transporter avatar
 *     description: Uploads a new avatar image for the transporter. Accepts `multipart/form-data` with an `avatar` field. Old avatar is deleted from Cloudinary. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, etc.)
 *     responses:
 *       200:
 *         description: Transporter avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Avatar file missing or upload failed
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
 */
router.route("/update_avatar").patch(TransporterJWTVerify, upload.single("avatar"), updateUserAvatar)

/**
 * @swagger
 * /api/v1/user/transporter/update_profile:
 *   patch:
 *     tags:
 *       - User — Transporter
 *     summary: Update transporter profile data
 *     description: Updates the nested `transporterProfile` object (tier, verification, vehicle, bank details, preferences, availability, certifications, emergency contact). All fields are optional — only provided fields are updated. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTransporterProfileBody'
 *     responses:
 *       200:
 *         description: Transporter profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized — missing or invalid access_token cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/update_profile").patch(TransporterJWTVerify, updateTransporterProfile)

export default router