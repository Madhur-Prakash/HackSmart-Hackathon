import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar,
    updateCustomerProfile
} from "../controllers/customer.controller.js";
import { CustomerJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/user/customer/update_account_details:
 *   patch:
 *     tags:
 *       - User — Customer
 *     summary: Update customer account details
 *     description: Updates basic account info (email, bio, phone, gender, date of birth). Note — `gender` and `dateOfBirth` can only be set once. Requires a valid `access_token` cookie.
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
 *         description: Customer details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or attempt to change immutable field (gender/dateOfBirth)
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
 * /api/v1/user/customer/update_avatar:
 *   patch:
 *     tags:
 *       - User — Customer
 *     summary: Update customer avatar
 *     description: Uploads a new avatar image for the customer. Accepts `multipart/form-data` with an `avatar` field. Old avatar is deleted from Cloudinary. Requires a valid `access_token` cookie.
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
 *         description: Customer avatar updated successfully
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

/**
 * @swagger
 * /api/v1/user/customer/update_profile:
 *   patch:
 *     tags:
 *       - User — Customer
 *     summary: Update customer profile data
 *     description: Updates the nested `customerProfile` object (vehicles, addresses, preferences, subscription plan, payment methods). All fields are optional — only provided fields are updated. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerProfileBody'
 *     responses:
 *       200:
 *         description: Customer profile updated successfully
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
router.route("/update_profile").patch(CustomerJWTVerify, updateCustomerProfile)

export default router