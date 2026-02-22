import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const JWTVerify = asyncHandler(async (req, _, next) => { // replace res by _ as we are not using it in this middleware
    try {
        const access_token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "") // replace "Bearer " with empty string to get the token only
        if(!access_token){
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("Access token received in middleware");
        
    
        const decoded_info = jwt.verify(access_token, process.env.ACESS_TOKEN_SECRET)
        
        const user = await User.findById(decoded_info?._id).select("-password -refresh_token")
        if (!user) {
                throw new ApiError(401, "Invalid Access Token")}
        console.log("User found:", user.user_name);
    
        req.user = user;  // attach user to request object
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request")
    }
    }) 