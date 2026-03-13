import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

//  ===================================
//  NOTE: This file is the main entry point of the application
//  ===================================
// OUT OF TOPIC INFO:> For server side rendering, you can use ejs, pug, or handlebars as the template engine
//  ===================================


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// basic app configuration
app.use(express.json({limit: "20kb"})) // this is done to limit the size of the request body, exprerss.json() is used to parse JSON request bodies
app.use(express.urlencoded({extended: false, limit: "20kb"})) // this is done to limit the size of the urlencoded request body, // express.urlencoded() is used to parse form data in the request body
app.use(express.static("public")) // this is done to serve static files from the public directory
app.use(cookieParser()) // this is done to parse cookies from the request

// swagger documentation route
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// import routes
// auth routes
import AuthCompanyRouter from './services/auth/routes/company.router.js'; 
import AuthStaffRouter from './services/auth/routes/staff.router.js';
import AuthRegionalAdminRouter from './services/auth/routes/regional_admin.router.js';
import AuthCustomerRouter from './services/auth/routes/customer.router.js';
import AuthTransporterRouter from './services/auth/routes/transporter.router.js';
import AuthHealthCheck from "./services/auth/routes/healthcheck.router.js"

// profile update routes
import ProfileUpdateCompanyRouter from "./services/user/routes/company.router.js";
import ProfileUpdateStaffRouter from "./services/user/routes/staff.router.js";
import ProfileUpdateTransporterRouter from "./services/user/routes/transporter.router.js";
import ProfileUpdateRegionalAdminRouter from "./services/user/routes/regional_admin.router.js";
import ProfileUpdateCustomerRouter from "./services/user/routes/customer.router.js";
import UserHealthCheck from './services/user/routes/healthcheck.router.js';


// routes declaration
// auth routes
app.use("/api/v1/auth/companies", AuthCompanyRouter)
app.use("/api/v1/auth/transporters", AuthTransporterRouter)
app.use("/api/v1/auth/customers", AuthCustomerRouter)
app.use("/api/v1/auth/staff", AuthStaffRouter)
app.use("/api/v1/auth/regional_admins", AuthRegionalAdminRouter)
app.use("/api/v1/auth", AuthHealthCheck)

// profile update routes
app.use("/api/v1/user/company", ProfileUpdateCompanyRouter)
app.use("/api/v1/user/staff", ProfileUpdateStaffRouter)
app.use("/api/v1/user/regional_admin", ProfileUpdateRegionalAdminRouter)
app.use("/api/v1/user/customer", ProfileUpdateCustomerRouter)
app.use("/api/v1/user/transporter", ProfileUpdateTransporterRouter)
app.use("/api/v1/user", UserHealthCheck)

export {app}