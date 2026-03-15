import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar
} from "../controllers/company.controller.js";
import { CompanyJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/user/company/update_account_details:
 *   patch:
 *     tags:
 *       - User — Company
 *     summary: Update company account details
 *     description: Updates basic account info (email, bio, phone, gender, date of birth) for a company. Requires a valid `access_token` cookie.
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
 *         description: Company details updated successfully
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
router.route("/update_account_details").patch(CompanyJWTVerify, updateAccountDetails)

/**
 * @swagger
 * /api/v1/user/company/update_avatar:
 *   patch:
 *     tags:
 *       - User — Company
 *     summary: Update company avatar
 *     description: Uploads a new avatar/logo image for the company. Accepts `multipart/form-data` with an `avatar` field. Old avatar is deleted from Cloudinary. Requires a valid `access_token` cookie.
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
 *         description: Company avatar updated successfully
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
router.route("/update_avatar").patch(CompanyJWTVerify, upload.single("avatar"), updateUserAvatar)

export default router