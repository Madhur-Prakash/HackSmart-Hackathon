import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    registerUser, 
    getCurrentUser, 
    changeCurrentPassword,} from "../controllers/staff.controller.js";
import { StaffJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/auth/staff/register:
 *   post:
 *     tags:
 *       - Auth — Staff
 *     summary: Register a new staff member
 *     description: Creates a new staff account. Password is auto-generated and emailed to the staff member. Sets `access_token` and `refresh_token` HttpOnly cookies on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterStaffBody'
 *     responses:
 *       201:
 *         description: Staff registered successfully. Credentials sent via email.
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
 *         description: Staff already exists with this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/register").post(registerUser)

/**
 * @swagger
 * /api/v1/auth/staff/login:
 *   post:
 *     tags:
 *       - Auth — Staff
 *     summary: Login a staff member
 *     description: Authenticates a staff member by email or username + password. Sets `access_token` and `refresh_token` HttpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Staff logged in successfully
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
 *         description: Staff member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/login").post(loginUser)

/**
 * @swagger
 * /api/v1/auth/staff/refresh_access_token:
 *   post:
 *     tags:
 *       - Auth — Staff
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
 * /api/v1/auth/staff/change_password:
 *   post:
 *     tags:
 *       - Auth — Staff
 *     summary: Change staff password
 *     description: Allows a logged-in staff member to change their password. Requires a valid `access_token` cookie.
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
 * /api/v1/auth/staff/logout:
 *   post:
 *     tags:
 *       - Auth — Staff
 *     summary: Logout the current staff member
 *     description: Clears the `access_token` and `refresh_token` cookies. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Staff logged out successfully
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
router.route("/logout").post(StaffJWTVerify, logoutUser)

/**
 * @swagger
 * /api/v1/auth/staff/current_user:
 *   get:
 *     tags:
 *       - Auth — Staff
 *     summary: Get the currently authenticated staff member
 *     description: Returns the staff object for the user identified by the `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current staff member fetched successfully
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
router.route("/current_user").get(StaffJWTVerify, getCurrentUser)

export default router