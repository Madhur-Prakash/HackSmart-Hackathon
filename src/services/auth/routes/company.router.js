import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    registerUser, 
    getCurrentUser, 
    changeCurrentPassword,} from "../controllers/company.controller.js";
import { CompanyJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/auth/companies/register:
 *   post:
 *     tags:
 *       - Auth — Company
 *     summary: Register a new company (super admin)
 *     description: Creates a new company/super-admin account. Sets `access_token` and `refresh_token` HttpOnly cookies on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterCompanyBody'
 *     responses:
 *       201:
 *         description: Company registered successfully
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
 *         description: Company already exists with this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/register").post(registerUser)

/**
 * @swagger
 * /api/v1/auth/companies/login:
 *   post:
 *     tags:
 *       - Auth — Company
 *     summary: Login a company
 *     description: Authenticates a company by email or username + password. Sets `access_token` and `refresh_token` HttpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Company logged in successfully
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
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/login").post(loginUser)

/**
 * @swagger
 * /api/v1/auth/companies/refresh_access_token:
 *   post:
 *     tags:
 *       - Auth — Company
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
 * /api/v1/auth/companies/change_password:
 *   post:
 *     tags:
 *       - Auth — Company
 *     summary: Change company password
 *     description: Allows a logged-in company admin to change their password using the `access_token` cookie.
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
 * /api/v1/auth/companies/logout:
 *   post:
 *     tags:
 *       - Auth — Company
 *     summary: Logout the current company
 *     description: Clears the `access_token` and `refresh_token` cookies and invalidates the session. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Company logged out successfully
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
router.route("/logout").post(CompanyJWTVerify, logoutUser)

/**
 * @swagger
 * /api/v1/auth/companies/current_user:
 *   get:
 *     tags:
 *       - Auth — Company
 *     summary: Get the currently authenticated company
 *     description: Returns the company object for the user identified by the `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current company fetched successfully
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
router.route("/current_user").get(CompanyJWTVerify, getCurrentUser)

export default router