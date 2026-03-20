import { app } from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";
import { connectRedis } from "./config/redis.js"; 

dotenv.config({path: "./.env"})

const app_port = process.env.PORT

// check redis connection
connectRedis()
.then( () => {
    console.log("Redis connected !! Redis port: " + process.env.REDIS_PORT);
})
.catch( (error) => {
    console.log(`Error in connecting to Redis: ${error}`);
    process.exit(1);
})

// connect to MongoDB and start the server
connectDB()
.then( () => {
    app.on("error", (error) => {
        console.log(`Error in initializing express app: ${error}`);
        throw error;  
    })
    app.listen(app_port || 8000, () => {
        console.log(`Server is running at port ${app_port}`);
        console.log(`Documentation available at http://localhost:${app_port}/docs`);
        
    })
})
.catch( (error) => {
    console.log(`MongoDB connection error: ${error}`);
    
}) 
