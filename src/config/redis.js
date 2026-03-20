import Redis from "ioredis";

const connect_redis = async () => {
    try {
        const redis_client = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: process.env.REDIS_PORT || 6379,
        });

        redis_client.on("connect", () => {
            console.log("Connected to Redis successfully");
        });
        return redis_client;
    } catch (error) {
        console.log(`Error in connecting to Redis: ${error}`);
        process.exit(1);
    }
}

export const redis_client = await connect_redis()