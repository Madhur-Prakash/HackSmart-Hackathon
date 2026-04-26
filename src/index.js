import { app } from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";
import { connectRedis } from "./config/redis.js"; 
import { initializeQrExpirySubscriber } from "./utils/helper.js";
import logger from "./utils/logger.js";

dotenv.config({path: "./.env"})

const app_port = process.env.PORT

const startServer = async () => {
    try {
        // 1. Redis
        await connectRedis();
        await initializeQrExpirySubscriber();
        console.log("Connected to Redis and initialized QR expiry subscriber");
        logger.info({ port: process.env.REDIS_PORT }, "Redis connected");
        console.log("Connected to Redis and initialized QR expiry subscriber");
        logger.info("QR expiry subscriber initialized");

        // 2. Mongo
        await connectDB();

        // 3. Start server
        app.on("error", (error) => {
            console.error("Express app error:", error);
            logger.error({ error }, "Error in initializing express app");
            throw error;
        });

        app.listen(app_port || 8000, () => {
            console.log(`Server is running on port ${app_port || 8000}`);
            logger.info({ port: app_port || 8000 }, "Server is running");
            console.log(`API documentation available at http://localhost:${app_port || 8000}/docs`);
            logger.info(`Docs: http://localhost:${app_port || 8000}/docs`);
        });

    } catch (error) {
        console.error("Startup error:", error);
        logger.error({ error }, "Startup error");
        process.exit(1);
    }
};

startServer();