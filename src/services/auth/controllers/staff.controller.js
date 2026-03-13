import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { options } from "../../../constants.js";
import {Staff} from "../models/staff.model.js"
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { create_access_token, 
    create_refresh_token, 
    generateUsername, 
    isPasswordCorrect, 
    sendEmail 
} from "../../../utils/helper.js";

const registerUser = asyncHandler( async (req, res) => {
    const {full_name, email, phone_number, addhar_card_number, country_code, role} = req.body

    if([full_name, email, phone_number, addhar_card_number, country_code, role].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }
    if (role !== "staff"){
        throw new ApiError(400, "Invalid role")
    }
    if(!email.includes("@")){
        throw new ApiError(400, "Email is not valid")
    }
    let user_name;
    const existing_user = await Staff.findOne({"email": email})
    // console.log("user:",existing_user);
    
    if (existing_user){
        throw new ApiError(409, "Staff already exists with this email")
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

    // auto generating the password for regional admin
    const password = user_name + Math.floor(Math.random() * 1000000) 
    // hash the password
    const salt = await bcrypt.genSalt(10); // generate a salt
    const hashed_password = await bcrypt.hash(password, salt) // hash the password

    //  insert in db
    const new_user = await Staff.create({
        full_name: full_name,
        user_name: user_name,
        email: email,
        phone_number: phone_number,
        addhar_card_number: addhar_card_number,
        country_code: country_code,
        role: role,
        password: hashed_password
    })
    if(!new_user){
        throw new ApiError(500, "Staff registration failed")
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

    // send email to regional admin with the generated password and login details
    const email_subject = "Welcome to NavSwap - Your Regional Admin Account Details";
    const email_content = `
        <h1>Welcome to NavSwap!</h1>
        <p>Dear ${full_name},</p>
        <p>Your regional admin account has been successfully created. Below are your login details:</p>
        <ul>
            <li><strong>Username:</strong> ${user_name}</li>
            <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>You can log in to your account using the above credentials. For security reasons, we recommend changing your password after your first login.</p>
        <p>Please log in to your account and change your password immediately for security reasons.</p>
        <p>Best regards,<br/>NavSwap Team</p>
    `;
    await sendEmail(email, email_subject, email_content);
    console.log("Email sent to regional admin");
    // generate access and refresh token
    const access_token = create_access_token(new_user._id, new_user.user_name);
    console.log("Access token generated:", access_token);
    const refresh_token = create_refresh_token(new_user._id);
    console.log("Refresh token generated:", refresh_token);

    //  set encryted refresh token in user document
    const hashed_refresh_token = await bcrypt.hash(refresh_token, salt); // hash the refresh token
    new_user.refresh_token = hashed_refresh_token; // set refresh token in user document
    await new_user.save({validateBeforeSave: false}); // save the user without validating the user schema again

    return res.status(201).cookie("access_token", access_token, options).cookie("refresh_token", refresh_token, options).json(
        new ApiResponse(201, 
            {
                user: user_data, 
                access_token: access_token, 
                refresh_token: refresh_token}, 
                "Staff registered successfully")) 
            });     


const loginUser = asyncHandler(async (req, res) => {
    const {email, user_name, password} = req.body
    console.log("email:", email);
    
    if(! (user_name || email) ){
        throw new ApiError(400, "Staff name or email is required");
    }
    if(!password){
        throw new ApiError(400, "Password is required");
    }

    if (user_name){
        const user = await Staff.findOne({user_name: user_name});
        if(!user){
            throw new ApiError(404, "Staff not found with this user name");
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
                    "Staff logged in successfully"))
                } 
    else if (email){
        const user = await Staff.findOne({email: email});
        if(!user){
            throw new ApiError(404, "Staff not found with this user name");
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
                    "Staff logged in successfully"))
                }
        })


const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user; // user is attached to request object by JWTVerify middleware
    if(!user){
        throw new ApiError(401, "Unauthorized request");
    }

    await Staff.findByIdAndUpdate(
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

    console.log("Staff logged out successfully:", user.user_name);
    return res.status(200).clearCookie("access_token", options).clearCookie("refresh_token", options).json(
        new ApiResponse(200, {}, "Staff logged out successfully"))
})


const refresh_access_token = asyncHandler(async(req, res) => {
    const incoming_refresh_token = req.cookies?.refresh_token || req.header("Authorization")?.replace("Bearer ", "")

    if(!incoming_refresh_token){
        throw new ApiError(401, "Unauthorized request, refresh token is required")
    }

    try {
        const decoded_info = jwt.verify(incoming_refresh_token, process.env.REFRESH_TOKEN_SECRET)
        console.log("decoded info:", decoded_info)
        
        const user = await Staff.findById(decoded_info?._id)
            if (!user) {
                    throw new ApiError(401, "Invalid Refresh Token")}
            console.log("Staff found:", user.user_name);
    
            // verify the refresh tken with the one that is stored in db
            console.log("Incoming refresh token:", incoming_refresh_token);
            console.log("Stored refresh token in db:", user.refresh_token);
        const is_refresh_token_valid = await bcrypt.compare(incoming_refresh_token, user.refresh_token);
        console.log("Is refresh token valid:", is_refresh_token_valid);
        if(!is_refresh_token_valid){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        // generate new access token
        const access_token = create_access_token(user._id, user.user_name);
        const refresh_token = create_refresh_token(user._id);
        console.log("New access token generated:", access_token);
    
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
        throw new ApiError(400, "Staff name or email is required");
    }
    
    if (email){
        const existing_user = await Staff.findOne({email: email})
        if(!existing_user){
            throw new ApiError(400, "Staff dosen't exist")}

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
        const existing_user = await Staff.findOne({user_name: user_name})
        if(!existing_user){
            throw new ApiError(400, "Staff dosen't exist")}
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