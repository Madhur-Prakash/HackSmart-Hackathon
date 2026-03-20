import { app } from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";
import { connectRedis } from "./config/redis.js"; 

dotenv.config({path: "./.env"})

const app_port = process.env.PORT

const startServer = async () => {
    try {
        // 1. Redis
        await connectRedis();
        console.log("Redis connected on port:", process.env.REDIS_PORT);

        // 2. Mongo
        await connectDB();

        // 3. Start server
        app.on("error", (error) => {
            console.log(`Error in initializing express app: ${error}`);
            throw error;
        });

        app.listen(app_port || 8000, () => {
            console.log(`Server is running at port ${app_port}`);
            console.log(`Docs: http://localhost:${app_port}/docs`);
        });

    } catch (error) {
        console.error("Startup error:", error);
        process.exit(1);
    }
};

startServer();