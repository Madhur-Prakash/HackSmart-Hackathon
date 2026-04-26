import Redis from "ioredis";
import logger from "../utils/logger.js";

let redis_client;
const connectRedis = async () => {
    if (redis_client) return redis_client;

    try {
        redis_client = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: process.env.REDIS_PORT || 6379,
        });
        
        // Wait for the Redis client to be ready before proceeding
        await new Promise((resolve, reject) => {
            redis_client.once("ready", resolve);
            redis_client.once("error", reject);
        });
        
        redis_client.on("error", (error) => {
            logger.error({ error }, "Redis client error");
        });

        return redis_client;
    } catch (error) {
        logger.error({ error }, "Error in connecting to Redis");
        process.exit(1);
    }
}

const getRedisClient = () => {
    if (!redis_client) {
        throw new Error("Redis not initialized. Call connectRedis() first.");
    }
    return redis_client;
};

export { getRedisClient, connectRedis }