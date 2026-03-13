import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';

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


// import routes
import companyRouter from './services/auth/routes/company.routes.js'; 
import staffRouter from './services/auth/routes/staff.router.js';
import regionalAdminRouter from './services/auth/routes/regional_admin.route.js';
import healthcheckRouter from "./services/auth/routes/healthcheck.routes.js"
import customerRouter from './services/auth/routes/customer.route.js';
import transporterRouter from './services/auth/routes/transporter.route.js';
import { AuthHealthCheck } from './services/auth/controllers/healthcheck.controller.js';

// routes declaration
app.use("/api/v1//auth/companies", companyRouter)
app.use("/api/v1//auth/transporters", transporterRouter)
app.use("/api/v1//auth/customers", customerRouter)
app.use("/api/v1//auth/staff", staffRouter)
app.use("/api/v1//auth/regional_admins", regionalAdminRouter)
app.use("/api/v1//auth/healthcheck", healthcheckRouter)


export {app}