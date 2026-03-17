import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar
} from "../controllers/regional_admin.controller.js";
import { CustomerJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/user/regional_admin/update_account_details:
 *   patch:
 *     tags:
 *       - User — Regional Admin
 *     summary: Update regional admin account details
 *     description: Updates basic account info (email, bio, phone, gender, date of birth) for a regional admin. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBasicAccountDetailsBody'
 *     responses:
 *       200:
 *         description: Regional admin details updated successfully
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
router.route("/update_account_details").patch(CustomerJWTVerify, updateAccountDetails)

/**
 * @swagger
 * /api/v1/user/regional_admin/update_avatar:
 *   patch:
 *     tags:
 *       - User — Regional Admin
 *     summary: Update regional admin avatar
 *     description: Uploads a new avatar image for the regional admin. Accepts `multipart/form-data` with an `avatar` field. Old avatar is deleted from Cloudinary. Requires a valid `access_token` cookie.
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
 *         description: Regional admin avatar updated successfully
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
router.route("/update_avatar").patch(CustomerJWTVerify, upload.single("avatar"), updateUserAvatar)

export default router