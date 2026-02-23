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
import userRouter from './routes/user.routes.js'; 
import healthcheckRouter from "./routes/healthcheck.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)


export {app}