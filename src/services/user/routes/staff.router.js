import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar,
} from "../controllers/staff.controller.js";
import { StaffJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/user/staff/update_account_details:
 *   patch:
 *     tags:
 *       - User — Staff
 *     summary: Update staff account details
 *     description: Updates basic account info (email, bio, phone, gender, date of birth) for a staff member. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAccountDetailsBody'
 *     responses:
 *       200:
 *         description: Staff details updated successfully
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
router.route("/update_account_details").patch(StaffJWTVerify, updateAccountDetails)

/**
 * @swagger
 * /api/v1/user/staff/update_avatar:
 *   patch:
 *     tags:
 *       - User — Staff
 *     summary: Update staff avatar
 *     description: Uploads a new avatar image for the staff member. Accepts `multipart/form-data` with an `avatar` field. Old avatar is deleted from Cloudinary. Requires a valid `access_token` cookie.
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
 *         description: Staff avatar updated successfully
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
router.route("/update_avatar").patch(StaffJWTVerify, upload.single("avatar"), updateUserAvatar)

export default router