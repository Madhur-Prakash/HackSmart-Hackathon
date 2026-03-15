import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    registerUser, 
    getCurrentUser, 
    changeCurrentPassword,} from "../controllers/customer.controller.js";
import { CustomerJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

/**
 * @swagger
 * /api/v1/auth/customers/register:
 *   post:
 *     tags:
 *       - Auth — Customer
 *     summary: Register a new customer
 *     description: Creates a new customer account. Sets `access_token` and `refresh_token` HttpOnly cookies on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterCustomerBody'
 *     responses:
 *       201:
 *         description: Customer registered successfully
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
 *         description: Validation error (missing fields, invalid email, short password, wrong license length)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Customer already exists with this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/register").post(registerUser)

/**
 * @swagger
 * /api/v1/auth/customers/login:
 *   post:
 *     tags:
 *       - Auth — Customer
 *     summary: Login a customer
 *     description: Authenticates a customer by email or username + password. Sets `access_token` and `refresh_token` HttpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Customer logged in successfully
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
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/login").post(loginUser)

/**
 * @swagger
 * /api/v1/auth/customers/refresh_access_token:
 *   post:
 *     tags:
 *       - Auth — Customer
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
 * /api/v1/auth/customers/change_password:
 *   post:
 *     tags:
 *       - Auth — Customer
 *     summary: Change customer password
 *     description: Allows a logged-in customer to change their password using the `access_token` cookie.
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
 *       400:
 *         description: Validation error
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
router.route("/change_password").post(changeCurrentPassword)

/**
 * @swagger
 * /api/v1/auth/customers/logout:
 *   post:
 *     tags:
 *       - Auth — Customer
 *     summary: Logout the current customer
 *     description: Clears the `access_token` and `refresh_token` cookies and invalidates the session. Requires a valid `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Customer logged out successfully
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
router.route("/logout").post(CustomerJWTVerify, logoutUser)

/**
 * @swagger
 * /api/v1/auth/customers/current_user:
 *   get:
 *     tags:
 *       - Auth — Customer
 *     summary: Get the currently authenticated customer
 *     description: Returns the customer object for the user identified by the `access_token` cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current customer fetched successfully
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
router.route("/current_user").get(CustomerJWTVerify, getCurrentUser)

export default router