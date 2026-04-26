import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../utils/logger.js";

const connectDB = (async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        logger.info({ host: connectionInstance.connection.host }, "MongoDB connected");
        
    } catch (error) {
        logger.error({ error }, "Error in connecting to MongoDB");
        process.exit(1);
    }
})

export default connectDB