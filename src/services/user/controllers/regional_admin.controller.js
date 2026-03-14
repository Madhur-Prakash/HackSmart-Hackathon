
import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../../utils/cloudinary.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {phone_number, country_code, email} = req.body

    if( !email){
        throw new ApiError(400, "Email is required")}

    const user = req.user
    user.email = email
    if (phone_number && !country_code) {
        throw new ApiError(400, "Country code is required when phone number is provided")
    }
    if (phone_number) user.phone_number = phone_number;
    if (country_code) user.country_code = country_code;
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {user: user}, "RegionalAdmin details updated successfully"))})


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
    // const updated_user = await RegionalAdmin.findByIdAndUpdate(
    //     user?._id,
    // { $set: {avatar: avatar.url}},
    // {new: true}).select("-password -refresh_token") // if this is true then it will return the updated document
    // return res.status(200).json(new ApiResponse(200, {user: updated_user}, "RegionalAdmin avatar updated successfully"))

    return res.status(200).json(new ApiResponse(200, {user: user}, "RegionalAdmin avatar updated successfully"))
})

export {
    updateAccountDetails,
    updateUserAvatar
}