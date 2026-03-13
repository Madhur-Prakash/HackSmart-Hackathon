import { app } from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";

dotenv.config({path: "./.env"})

const app_port = process.env.PORT

connectDB()
.then( () => {
    app.on("error", (error) => {
        console.log(`Error in initializing express app: ${error}`);
        throw error;  
    })
    app.listen(app_port || 8000, () => {
        console.log(`Server is running at port ${app_port}`);
        
    })
})
.catch( (error) => {
    console.log(`MongoDB connection error: ${error}`);
    
}) 


// using async/await for the same functionality
// ;(async () => { // the semicolon is very important here to avoid issues with the previous line, infact it is a good practice to start an IIFE with a semicolon

//   try {
//     await connectDB();

//     app.on("error", (error) => {
//       console.log(`Error in initializing express app: ${error}`);
//       throw error;
//     });

//     app.listen(app_port || 8000, () => {
//       console.log(`Server is running at port ${app_port}`);
//     });
//   } catch (error) {
//     console.log(`MongoDB connection error: ${error}`);
//   }
// })();
