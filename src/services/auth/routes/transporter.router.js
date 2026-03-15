import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    registerUser, 
    getCurrentUser, 
    changeCurrentPassword,} from "../controllers/transporter.controller.js";
import {upload} from "../../../middlewares/multer.middleware.js"
import { TransporterJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/auth/transporters/register:
 *   post:
 *     tags:
 *       - Auth — Transporter
 *     summary: Register a new transporter
 *     description: Creates a new transporter account. Sets `access_token` and `refresh_token` HttpOnly cookies on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterTransporterBody'
 *     responses:
 *       201:
 *         description: Transporter registered successfully
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
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Transporter already exists with this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/register").post(registerUser)

/**
 * @swagger
 * /api/v1/auth/transporters/login:
 *   post:
 *     tags:
 *       - Auth — Transporter
 *     summary: Login a transporter
 *     description: Authenticates a transporter by email or username + password. Sets `access_token` and `refresh_token` HttpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Transporter logged in successfully
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
 *         description: Transporter not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/login").post(loginUser)

/**
 * @swagger
 * /api/v1/auth/transporters/refresh_access_token:
 *   post:
 *     tags:
 *       - Auth — Transporter
 *     summary: Refresh the access token
 *     description: Uses the `refresh_token` cookie to issue a new `access_token` cookie. No request body needed.
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: Sets new access_token and refresh_token HttpOnly cookies
 *             schema:
 *               type: string
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
 * /api/v1/auth/transporters/change_password:
 *   post:
 *     tags:
 *       - Auth — Transporter
 *     summary: Change transporter password
 *     description: Allows a logged-in transporter to change their password using the `access_token` cookie.
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
 * /api/v1/auth/transporters/logout:
 *   post:
 *     tags:
 *       - Auth — Transporter
 *     summary: Logout the current transporter
 *     description: Clears the `access_token` and `refresh_token` cookies and invalidates the session. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Transporter logged out successfully
 *         headers:
 *           Set-Cookie:
 *             description: Clears access_token and refresh_token cookies
 *             schema:
 *               type: string
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
router.route("/logout").post(TransporterJWTVerify, logoutUser)

/**
 * @swagger
 * /api/v1/auth/transporters/current_user:
 *   get:
 *     tags:
 *       - Auth — Transporter
 *     summary: Get the currently authenticated transporter
 *     description: Returns the transporter object for the user identified by the `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current transporter fetched successfully
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
router.route("/current_user").get(TransporterJWTVerify, getCurrentUser)

export default router