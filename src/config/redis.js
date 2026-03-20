import Redis from "ioredis";

let redis_client;
const connectRedis = async () => {
    try {
        redis_client = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: process.env.REDIS_PORT || 6379,
        });

        return redis_client;
    } catch (error) {
        console.log(`Error in connecting to Redis: ${error}`);
        process.exit(1);
    }
}

const getRedisClient = () => {
    if (!redis_client) {
        throw new Error("Redis not initialized. Call connect_redis() first.");
    }
    return redis_client;
};

export { getRedisClient, connectRedis }