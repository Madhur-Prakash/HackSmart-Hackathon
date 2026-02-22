import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { create_access_token, create_refresh_token, isPasswordCorrect } from "../utils/helper.js";
import mongoose from "mongoose";


const registerUser = asyncHandler( async (req, res) => {
    const {full_name, email, user_name, password} = req.body

    if([full_name, email, user_name, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }
    if(!email.includes("@")){
        throw new ApiError(400, "Email is not valid")
    }

    const existing_user = await User.findOne({"email": email})
    // console.log("user:",existing_user);
    
    if (existing_user){
        throw new ApiError(409, "User already exists with this email")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; // files are uploaded on local server through multer middleware
    // const cover_imageLocalPath = req.files?.cover_image[0]?.path; //this is not used as cover image is optional

    let cover_imageLocalPath;
    if(req.files && Array.isArray(req.files.cover_image) && req.files.cover_image.length > 0) {
        cover_imageLocalPath = req.files.cover_image[0].path; // Get the path of the cover image file
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    // uploading avatar and cover image on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    let cover_image = null; // Initialize cover_image as null
    if(cover_imageLocalPath) {
        cover_image = await uploadOnCloudinary(cover_imageLocalPath)
    }
    
    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }

    //  insert in db
    const new_user = await User.create({
        full_name: full_name,
        avatar: avatar.url,
        cover_image: cover_image?.url || "",
        user_name: user_name,
        email: email,
        password: password
    })
    if(!new_user){
        throw new ApiError(500, "User registration failed")
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
    console.log("Access token generated:", access_token);
    const refresh_token = create_refresh_token(new_user._id);
    console.log("Refresh token generated:", refresh_token);

    //  set encryted refresh token in user document
    const salt = await bcrypt.genSalt(10); // generate a salt
    const hashed_refresh_token = await bcrypt.hash(refresh_token, salt); // hash the refresh token
    new_user.refresh_token = hashed_refresh_token; // set refresh token in user document
    await new_user.save({validateBeforeSave: false}); // save the user without validating the user schema again

    console.log("new_user:", user_data);
    return res.status(201).cookie("access_token", access_token, options).cookie("refresh_token", refresh_token, options).json(
        new ApiResponse(201, 
            {
                user: user_data, 
                access_token: access_token, 
                refresh_token: refresh_token}, 
                "User registered successfully")) 
            });     


const loginUser = asyncHandler(async (req, res) => {
    const {email, user_name, password} = req.body
    console.log("email:", email);
    
    if(! (user_name || email) ){
        throw new ApiError(400, "User name or email is required");
    }
    if(!password){
        throw new ApiError(400, "Password is required");
    }

    if (user_name){
        const user = await User.findOne({user_name: user_name});
        if(!user){
            throw new ApiError(404, "User not found with this user name");
        }
        
        const hashed_password = await isPasswordCorrect(password, user.password); 
        console.log("hashed_password:", hashed_password);
        if(!hashed_password){
            throw new ApiError(401, "Invalid password");
        }
        //  remove password and refresh token from user data
        const user_data = user.toObject();
        if(user_data.refresh_token) {
        console.log("Removing refresh token from user data");
        delete user_data.refresh_token; // Remove refresh token field
        }
        if(user_data.password){
            console.log("Removing password field from the response");
            delete user_data.password;
        }
        
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
                    "User logged in successfully"))
                } 
    else if (email){
        const user = await User.findOne({email: email});
        if(!user){
            throw new ApiError(404, "User not found with this user name");
        }
        
        const hashed_password = await isPasswordCorrect(password, user.password); 
        console.log("hashed_password:", hashed_password);
        
        if(!hashed_password){
            throw new ApiError(401, "Invalid password");
        }
        //  remove password and refresh token from user data
        const user_data = user.toObject();
        if(user_data.refresh_token) {
        console.log("Removing refresh token from user data");
        delete user_data.refresh_token; // Remove refresh token field
        }
        if(user_data.password){
            console.log("Removing password field from the response");
            delete user_data.password;
        }
        
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
                    "User logged in successfully"))
                }
        })


const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user; // user is attached to request object by JWTVerify middleware
    if(!user){
        throw new ApiError(401, "Unauthorized request");
    }

    await User.findByIdAndUpdate(
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

    console.log("User logged out successfully:", user.user_name);
    return res.status(200).clearCookie("access_token", options).clearCookie("refresh_token", options).json(
        new ApiResponse(200, {}, "User logged out successfully"))
})


const refresh_access_token = asyncHandler(async(req, res) => {
    const incoming_refresh_token = req.cookies?.refresh_token || req.header("Authorization")?.replace("Bearer ", "")

    if(!incoming_refresh_token){
        throw new ApiError(401, "Unauthorized request, refresh token is required")
    }

    try {
        const decoded_info = jwt.verify(incoming_refresh_token, process.env.REFRESH_TOKEN_SECRET)
        console.log("decoded info:", decoded_info)
        
        const user = await User.findById(decoded_info?._id)
            if (!user) {
                    throw new ApiError(401, "Invalid Refresh Token")}
            console.log("User found:", user.user_name);
    
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
        if(user_data.password){
            console.log("Removing password field from the response");
            delete user_data.password; // Remove password field
        }
        if(user_data.refresh_token){
            console.log("Removing refresh token field from the response");
            delete user_data.refresh_token; // Remove refresh token field
        }
    
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
        throw new ApiError(400, "User name or email is required");
    }
    
    if (email){
        const existing_user = await User.findOne({email: email})
        if(!existing_user){
            throw new ApiError(400, "User dosen't exist")}

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
        const existing_user = await User.findOne({user_name: user_name})
        if(!existing_user){
            throw new ApiError(400, "User dosen't exist")}
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

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {full_name, email} = req.body

    if(!full_name || !email){
        throw new ApiError(400, "Full name and email are required")}

    const user = req.user
    user.full_name = full_name
    user.email = email
    await user.save({validateBeforeSave: false})

    // alternative method to update details:
    // const updated_user = await User.findByIdAndUpdate(
    //     user?._id,
    // {
    //     $set: {
    //         full_name: full_name,
    //         email: email
    //     }}, {new: true}).select("-password -refresh_token") // if this is true then it will return the updated document
    
    // if(!updated_user){
    //     throw new ApiError(500, "User details update failed")}
    // return res.status(200).json(new ApiResponse(200, {user: updated_user}, "User details updated successfully"))})

    return res.status(200).json(new ApiResponse(200, {user: user}, "User details updated successfully"))})


const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")}       

    const user = req.user; 
    if(!user){
        throw new ApiError(401, "Unauthorized request")}

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    console.log("Avatar uploaded:", avatar);
    if(!avatar){
        throw new ApiError(400, "Avatar upload failed")}
    if(user.avatar){
        console.log("Deleting old avatar from cloudinary:", user.avatar);
        const delete_old_file = await deleteFromCloudinary(user.avatar); // delete the old avatar from cloudinary
        if(delete_old_file){
        console.log("Old avatar deleted successfully", delete_old_file);}
    }

    user.avatar = avatar.url // update avatar in user document
    await user.save({validateBeforeSave: false}) // save the user without validating the user schema again

    // alernative method to update avatar:
    // const updated_user = await User.findByIdAndUpdate(
    //     user?._id,
    // { $set: {avatar: avatar.url}},
    // {new: true}).select("-password -refresh_token") // if this is true then it will return the updated document
    // return res.status(200).json(new ApiResponse(200, {user: updated_user}, "User avatar updated successfully"))

    return res.status(200).json(new ApiResponse(200, {user: user}, "User avatar updated successfully"))
})


const updateUserCoverImage = asyncHandler(async(req, res) => {
    const cover_imageLocalPath = req.file?.path

    if(!cover_imageLocalPath){
        throw new ApiError(400, "Cover Image is required")}       

    const user = req.user; 
    if(!user){
        throw new ApiError(401, "Unauthorized request")}

    const cover_image = await uploadOnCloudinary(cover_imageLocalPath)

    console.log("Cover image uploaded:", cover_image);
    if(!cover_image){
        throw new ApiError(400, "Cover image upload failed")}
    if(user.cover_image){
        console.log("Deleting old cover_image from cloudinary:", cover_image);
        const delete_old_file = await deleteFromCloudinary(user.cover_image); // delete the old avatar from cloudinary
        if(delete_old_file){
        console.log("Old cover_image deleted successfully", delete_old_file);}}

    user.cover_image = cover_image.url // update cover image in user document
    await user.save({validateBeforeSave: false}) // save the user without validating the user schema again

    // alernative method to update avatar:
    // const updated_user = await User.findByIdAndUpdate(
    //     user?._id,
    // { $set: {cover_image: cover_image.url}},
    // {new: true}).select("-password -refresh_token") // if this is true then it will return the updated document
    // return res.status(200).json(new ApiResponse(200, {user: updated_user}, "User cover image updated successfully"))

    return res.status(200).json(new ApiResponse(200, {user: user}, "User Cover image updated successfully"))
})


const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {user_name} = req.params 

    if(!user_name?.trim()){
        throw new ApiError(400, "User name is missing")}

    const channel = await User.aggregate([
        {
            $match: {
                user_name: user_name
            }
        },
        {
            $lookup: {
                from: "subscriptions", // Subscription is changed to subscriptions in the database(default pluralization by mongoose)
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" // subscribers is an array of objects with subscriber field which is an array of user ids
            }
        },
        {
            $lookup: {
                from: "subscriptions", // Subscription is changed to subscriptions in the database(default pluralization by mongoose)
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed_to" // subscribed_to is an array of objects with channel field which is an user id
            }
        },
        {
            $addFields: {
                subcribers_count: {
                    $size: "$subscribers" // counting the number of subscribers
                },
                channels_subcribed_to_count:{
                    $size: "$subscribed_to" // counting the number of channels subscribed to
                },
                is_subscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]}, // checking if the user is in the subscribers array
                        then : true, // if user is in the subscribers array then is_subscribed is true
                        else: false // if user is not in the subscribers array then is_subscribed is false
                    }
                }
                
            }
        },
        {
            $project: { // projecting the fields to be returned
                full_name: 1,
                user_name: 1,
                email: 1,
                avatar: 1,
                cover_image: 1,
                subcribers_count: 1,
                channels_subcribed_to_count: 1,
                is_subscribed: 1
            }
        }
    ])

    if(!channel || channel.length === 0){
        throw new ApiError(404, "Channel not found with this user name")}
    console.log("Channel profile fetched successfully:", channel);

    return res.status(200).json(new ApiResponse(200, {channel: channel[0]}, "Channel profile fetched successfully"))
})


const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id) // this is done as when we write req.user._id in mongoose build in methods(findOne, findById etc..), it is a string and mongoose internally do it, but in aggregation pipeline, we need to explicitly convert it to ObjectId as the code of aggregation pipeline is not aware of the mongoose methods, so we need to convert it to ObjectId 
            }
        },
        {
            $lookup: {
                from: "videos", //curremtly i am in users collection, so i need to lookup videos collection
                localField: "watch_history",
                foreignField: "_id",
                as: "watch_history",
                pipeline: [   // using sub-pipeline to get user info, otherwise owner field will be empty, we can use populate method also
                    {
                        $lookup: {
                            from: "users", // currently i am in videos collection, so i need to lookup users collection
                            localField: "video_owner",
                            foreignField: "_id",
                            as: "owner", // this will give me the user info of the video owner, but there will be too many unnecessary fields, so we will use $project to filter the fields
                            pipeline: [
                                {
                                    $project: {
                                        full_name: 1,
                                        user_name: 1,
                                        email: 1,
                                        avatar: 1,
                                        cover_image: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: { // this is done to get the first element of the owner array, as we are using $lookup, it will return an array of objects, but we only need first object
                            owner: {
                                $first: "$owner" // this will give me the first element of the owner array 
                                // or // $arrayElemAt: ["$owner", 0] // this will also give me the first element of the owner array   
                            }
                        }
                    }
                ]
            }
        }
    ])
    console.log("User watch history fetched successfully", user[0])
    return res.status(200).json(new ApiResponse(200, {watch_history: user[0].watch_history}, "Watch history fetched successfully"))
})


export { 
    registerUser,
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile,
    getWatchHistory };