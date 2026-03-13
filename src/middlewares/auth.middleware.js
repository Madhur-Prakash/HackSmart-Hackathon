import { Company } from "../services/auth/models/company.models.js";
import { Transporter } from "../services/auth/models/transporter.model.js";
import { Staff } from "../services/auth/models/staff.model.js";
import { Customer } from "../services/auth/models/customer.model.js";
import { RegionalAdmin } from "../services/auth/models/regional_admin.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const CompanyJWTVerify = asyncHandler(async (req, _, next) => { // replace res by _ as we are not using it in this middleware
    try {
        const access_token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "") // replace "Bearer " with empty string to get the token only
        if(!access_token){
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("Access token received in middleware");
        
    
        const decoded_info = jwt.verify(access_token, process.env.ACESS_TOKEN_SECRET)
        
        const user = await Company.findById(decoded_info?._id).select("-password -refresh_token")
        if (!user) {
                throw new ApiError(401, "Invalid Access Token")}
        console.log("Company found:", user.user_name);
    
        req.user = user;  // attach user to request object
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request")
    }
    }) 


const CustomerJWTVerify = asyncHandler(async (req, _, next) => { // replace res by _ as we are not using it in this middleware
    try {
        const access_token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "") // replace "Bearer " with empty string to get the token only
        if(!access_token){
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("Access token received in middleware");
        
    
        const decoded_info = jwt.verify(access_token, process.env.ACESS_TOKEN_SECRET)
        
        const user = await Customer.findById(decoded_info?._id).select("-password -refresh_token")
        if (!user) {
                throw new ApiError(401, "Invalid Access Token")}
        console.log("Customer found:", user.user_name);
    
        req.user = user;  // attach user to request object
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request")
    }
    }) 

const RegionalAdminJWTVerify = asyncHandler(async (req, _, next) => { // replace res by _ as we are not using it in this middleware
    try {
        const access_token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "") // replace "Bearer " with empty string to get the token only
        if(!access_token){
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("Access token received in middleware");
        
    
        const decoded_info = jwt.verify(access_token, process.env.ACESS_TOKEN_SECRET)
        
        const user = await RegionalAdmin.findById(decoded_info?._id).select("-password -refresh_token")
        if (!user) {
                throw new ApiError(401, "Invalid Access Token")}
        console.log("Regional Admin found:", user.user_name);
    
        req.user = user;  // attach user to request object
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request")
    }
    }) 

const TransporterJWTVerify = asyncHandler(async (req, _, next) => { // replace res by _ as we are not using it in this middleware
    try {
        const access_token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "") // replace "Bearer " with empty string to get the token only
        if(!access_token){
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("Access token received in middleware");
        
    
        const decoded_info = jwt.verify(access_token, process.env.ACESS_TOKEN_SECRET)
        
        const user = await Transporter.findById(decoded_info?._id).select("-password -refresh_token")
        if (!user) {
                throw new ApiError(401, "Invalid Access Token")}
        console.log("Transporter found:", user.user_name);
    
        req.user = user;  // attach user to request object
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request")
    }
    }) 

const StaffJWTVerify = asyncHandler(async (req, _, next) => { // replace res by _ as we are not using it in this middleware
    try {
        const access_token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "") // replace "Bearer " with empty string to get the token only
        if(!access_token){
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("Access token received in middleware");
        
    
        const decoded_info = jwt.verify(access_token, process.env.ACESS_TOKEN_SECRET)
        
        const user = await Staff.findById(decoded_info?._id).select("-password -refresh_token")
        if (!user) {
                throw new ApiError(401, "Invalid Access Token")}
        console.log("Staff found:", user.user_name);
    
        req.user = user;  // attach user to request object
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request")
    }
    }) 


export { CompanyJWTVerify, CustomerJWTVerify, RegionalAdminJWTVerify, TransporterJWTVerify, StaffJWTVerify }