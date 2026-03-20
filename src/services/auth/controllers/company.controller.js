import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { options, UserRole } from "../../../constants.js";
import {Company} from "../../../models/company.models.js"
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { create_access_token, create_refresh_token, generateUsername, isPasswordCorrect } from "../../../utils/helper.js";

const registerUser = asyncHandler( async (req, res) => {
    const {full_name, email, phone_number, country_code, role, password} = req.body

    if([full_name, email, phone_number, country_code, role, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }
    if (role && role !== UserRole.SUPER_ADMIN){
        throw new ApiError(400, "Invalid role")
    }
    if(!email.includes("@")){
        throw new ApiError(400, "Email is not valid")
    }
    let user_name;
    const existing_user = await Company.findOne({"email": email})
    // console.log("user:",existing_user);
    
    if (existing_user){
        throw new ApiError(409, "Company already exists with this email")
    }

    try {
      user_name = generateUsername(full_name);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate username — retry
        console.warn("Username collision detected, retrying...");
        return generateUsername(full_name); // This will generate a new username
      }
    }

    //  insert in db
    const new_user = await Company.create({
        full_name: full_name,
        user_name: user_name,
        email: email,
        phone_number: phone_number,
        country_code: country_code,
        password: password
    })
    if(!new_user){
        throw new ApiError(500, "Company registration failed")
    }

    // Remove password before sending response
    const user_data = new_user.toObject(); // Convert mongoose document to plain object

    //  remove refresh token and password from user data
    if(user_data.refresh_token) {
        console.log("Removing refresh token from user data");
        delete user_data.refresh_token; // Remove refresh token field
    }
    if(user_data.password) {
        console.log("Removing password from user data");
        delete user_data.password; // Remove password field
    }
    
    // generate access and refresh token
    const access_token = create_access_token(new_user._id, new_user.user_name);
    const refresh_token = create_refresh_token(new_user._id);

    //  set encryted refresh token in user document
    const salt = await bcrypt.genSalt(10); // generate a salt
    const hashed_refresh_token = await bcrypt.hash(refresh_token, salt); // hash the refresh token
    new_user.refresh_token = hashed_refresh_token; // set refresh token in user document
    await new_user.save({validateBeforeSave: false}); // save the user without validating the user schema again
    
    return res.status(201).cookie("access_token", access_token, options).cookie("refresh_token", refresh_token, options).json(
        new ApiResponse(201, 
            {
                user: user_data, 
                access_token: access_token, 
                refresh_token: refresh_token}, 
                "Company registered successfully")) 
            });     


const loginUser = asyncHandler(async (req, res) => {
    const {email, user_name, password} = req.body
    console.log("email:", email);
    
    if(! (user_name || email) ){
        throw new ApiError(400, "Company name or email is required");
    }
    if(!password){
        throw new ApiError(400, "Password is required");
    }

    if (user_name){
        const user = await Company.findOne({user_name: user_name});
        if(!user){
            throw new ApiError(404, "Company not found with this user name");
        }
        
        const hashed_password = await isPasswordCorrect(password, user.password); 
        if(!hashed_password){
            throw new ApiError(401, "Invalid password");
        }
        // remove password and refresh token from user data
        const user_data = user.toObject();
        // remove refresh token field from user data before sending response
        user_data.refresh_token ? delete user_data.refresh_token : console.log("Refresh token field is already removed from user data");

        // remove password field from user data before sending response
        user_data.password ? delete user_data.password : console.log("Password field is already removed from user data");
        
        // generate access and refresh token
        const access_token = create_access_token(user._id, user.user_name );
        const refresh_token = create_refresh_token(user._id);

        //  set encrypted refresh token in user document
        const salt = await bcrypt.genSalt(10); // generate a salt
        const hashed_refresh_token = await bcrypt.hash(refresh_token, salt); // hash the refresh token
        user.refresh_token = hashed_refresh_token; // set refresh token in user document
        await user.save({validateBeforeSave: false}); // save the user without validating the user schema again

        return res.status(200).cookie("access_token", access_token, options).cookie("refresh_token", refresh_token, options).json(
            new ApiResponse(200, 
                {
                    user: user_data, 
                    access_token: access_token, 
                    refresh_token: refresh_token}, 
                    "Company logged in successfully"))
                } 
    else if (email){
        const user = await Company.findOne({email: email});
        if(!user){
            throw new ApiError(404, "Company not found with this user name");
        }
        
        const hashed_password = await isPasswordCorrect(password, user.password); 
        console.log("hashed_password:", hashed_password);
        
        if(!hashed_password){
            throw new ApiError(401, "Invalid password");
        }
        //  remove password and refresh token from user data
        const user_data = user.toObject();
        user_data.refresh_token ? delete user_data.refresh_token : console.log("Refresh token field is already removed from user data");
        user_data.password ? delete user_data.password : console.log("Password field is already removed from user data");
        
        const access_token = create_access_token(user._id, user.user_name );
        const refresh_token = create_refresh_token(user._id);

        //  set encrypted refresh token in user document
        const salt = await bcrypt.genSalt(10); // generate a salt
        const hashed_refresh_token = await bcrypt.hash(refresh_token, salt); // hash the refresh token
        user.refresh_token = hashed_refresh_token; // set refresh token in user document
        await user.save({validateBeforeSave: false}); // save the user without validating the user schema again

        return res.status(200).cookie("access_token", access_token, options).cookie("refresh_token", refresh_token, options).json(
            new ApiResponse(200, 
                {
                    user: user_data, 
                    access_token: access_token, 
                    refresh_token: refresh_token}, 
                    "Company logged in successfully"))
                }
        })


const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user; // user is attached to request object by JWTVerify middleware
    if(!user){
        throw new ApiError(401, "Unauthorized request");
    }

    await Company.findByIdAndUpdate(
        user._id,
        {
            $unset: {
                refresh_token: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    console.log("Company logged out successfully:", user.user_name);
    return res.status(200).clearCookie("access_token", options).clearCookie("refresh_token", options).json(
        new ApiResponse(200, {}, "Company logged out successfully"))
})


const refresh_access_token = asyncHandler(async(req, res) => {
    const incoming_refresh_token = req.cookies?.refresh_token;

    if(!incoming_refresh_token){
        throw new ApiError(401, "Unauthorized request, refresh token is required")
    }

    try {
        const decoded_info = jwt.verify(incoming_refresh_token, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await Company.findById(decoded_info?._id)
            if (!user) {
                    throw new ApiError(401, "Invalid Refresh Token")}
    
            // verify the refresh tken with the one that is stored in db
        const is_refresh_token_valid = await bcrypt.compare(incoming_refresh_token, user.refresh_token);
        if(!is_refresh_token_valid){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        // generate new access token
        const access_token = create_access_token(user._id, user.user_name);
        const refresh_token = create_refresh_token(user._id);
    
        //  set encrypted refresh token in user document
        const salt = await bcrypt.genSalt(10); // generate a salt
        const hashed_refresh_token = await bcrypt.hash(refresh_token, salt); // hash the refresh token
        user.refresh_token = hashed_refresh_token; // set refresh token in user document
        await user.save({validateBeforeSave: false}); // save the user without validating the user schema again

        // remove password and refresh token from user data
        const user_data = user.toObject();
        user_data.refresh_token ? delete user_data.refresh_token : console.log("Refresh token field is already removed from user data");
        user_data.password ? delete user_data.password : console.log("Password field is already removed from user data");
    
        return res.status(200).cookie("access_token", access_token, options).cookie("refresh_token", refresh_token, options).json(
            new ApiResponse(200, 
                {
                    user: user_data, 
                    access_token: access_token, 
                    refresh_token: refresh_token}, 
                    "Access token refreshed successfully"))}
    catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request");
        
        }})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {new_password, confirm_password, email, user_name} = req.body
    if(!(new_password || confirm_password)){
        throw new ApiError(400, "Password and confirm password are required")}
    if(! (user_name || email) ){
        throw new ApiError(400, "Company name or email is required");
    }
    
    if (email){
        const existing_user = await Company.findOne({email: email})
        if(!existing_user){
            throw new ApiError(400, "Company dosen't exist")}

        if ( !(new_password === confirm_password)){
            throw new ApiError(400, "Password dosen't match")}
        if(new_password.length < 6){
            throw new ApiError(400, "Password must be at least 6 characters long")}

        const existing_password = await isPasswordCorrect(new_password, existing_user.password)
        if(existing_password){
            throw new ApiError(400, "New password can't be same as old password, kindly choose a new password")}
        
        existing_user.password = new_password // password will be automatically hashed by the pre-save hook in user model
        await existing_user.save({validateBeforeSave: false})

        return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))}

    else if(user_name){
        const existing_user = await Company.findOne({user_name: user_name})
        if(!existing_user){
            throw new ApiError(400, "Company dosen't exist")}
        if ( !(new_password === confirm_password)){
            throw new ApiError(400, "Password dosen't match")}
        if(new_password.length < 6){
            throw new ApiError(400, "Password must be at least 6 characters long")}
        const existing_password = await isPasswordCorrect(password, existing_user.password)
        if(existing_password){
            throw new ApiError(400, "New password can't be same as old password, kindly choose a new password")}
        
        existing_user.password = new_password // password will be automatically hashed by the pre-save hook in user model
        await existing_user.save({validateBeforeSave: false})
    
        return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))}
    })



const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user; // user is attached to request object by JWTVerify middleware
    if(!user){
        throw new ApiError(401, "Unauthorized request");}

    return res.status(200).json(new ApiResponse(200, {user: user}, "Current user fetched successfully"))
})


export { 
    registerUser,
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    changeCurrentPassword, 
    getCurrentUser
};