import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    registerUser, 
    getCurrentUser, 
    changeCurrentPassword,} from "../controllers/regional_admin.controller.js";
import { RegionalAdminJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/auth/regional_admins/register:
 *   post:
 *     tags:
 *       - Auth — Regional Admin
 *     summary: Register a new regional admin
 *     description: Creates a new regional admin account. Password is auto-generated and emailed to the admin. Sets `access_token` and `refresh_token` HttpOnly cookies on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRegionalAdminBody'
 *     responses:
 *       201:
 *         description: Regional admin registered successfully. Credentials sent via email.
 *         headers:
 *           Set-Cookie:
 *             description: Sets access_token and refresh_token HttpOnly cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error (missing fields, invalid role, invalid email)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Regional admin already exists with this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/register").post(registerUser)

/**
 * @swagger
 * /api/v1/auth/regional_admins/login:
 *   post:
 *     tags:
 *       - Auth — Regional Admin
 *     summary: Login a regional admin
 *     description: Authenticates a regional admin by email or username + password. Sets `access_token` and `refresh_token` HttpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Regional admin logged in successfully
 *         headers:
 *           Set-Cookie:
 *             description: Sets access_token and refresh_token HttpOnly cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing email/username or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Regional admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/login").post(loginUser)

/**
 * @swagger
 * /api/v1/auth/regional_admins/refresh_access_token:
 *   post:
 *     tags:
 *       - Auth — Regional Admin
 *     summary: Refresh the access token
 *     description: Uses the `refresh_token` cookie to issue a new `access_token` cookie. No request body needed.
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Missing or invalid refresh token cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/refresh_access_token").post(refresh_access_token)

/**
 * @swagger
 * /api/v1/auth/regional_admins/change_password:
 *   post:
 *     tags:
 *       - Auth — Regional Admin
 *     summary: Change regional admin password
 *     description: Allows a logged-in regional admin to change their password. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordBody'
 *     responses:
 *       200:
 *         description: Password changed successfully
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
router.route("/change_password").post(changeCurrentPassword)

/**
 * @swagger
 * /api/v1/auth/regional_admins/logout:
 *   post:
 *     tags:
 *       - Auth — Regional Admin
 *     summary: Logout the current regional admin
 *     description: Clears the `access_token` and `refresh_token` cookies. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Regional admin logged out successfully
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
router.route("/logout").post(RegionalAdminJWTVerify, logoutUser)

/**
 * @swagger
 * /api/v1/auth/regional_admins/current_user:
 *   get:
 *     tags:
 *       - Auth — Regional Admin
 *     summary: Get the currently authenticated regional admin
 *     description: Returns the regional admin object for the user identified by the `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current regional admin fetched successfully
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
router.route("/current_user").get(RegionalAdminJWTVerify, getCurrentUser)

export default router