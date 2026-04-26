import { v2 as cloudinary } from "cloudinary";
import fs from "fs" // file system for node js
import { ApiError } from "./ApiError.js";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (file_path) => {
    try {
        if(!file_path){
            throw new ApiError(400, "File path is required")
        }

        // upload on cloudinary
         const response = await cloudinary.uploader.upload(file_path, {
            resource_type: "auto"
        })
        logger.info({ url: response.url }, "File uploaded on cloudinary");
        fs.unlinkSync(file_path) // remove the localy saved file after upload operation is successful
        return response
    } catch (error) {
        fs.unlinkSync(file_path) // remove the localy saved file as the upload operation failed
        return null
    }
}


const extractPublicIdFromUrl = (url) => {
    try {
                
        // Remove query parameters and fragments
        const cleanUrl = url.split('?')[0].split('#')[0];
        
        // Find the upload segment and everything after it
        const uploadMatch = cleanUrl.match(/\/upload\/(.+)$/);
        if (!uploadMatch) {
            logger.warn("No upload segment found in URL");
            return null;
        }
        
        let pathAfterUpload = uploadMatch[1];
        
        // Remove version prefix if present (v1234567890/)
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
        
        // Remove file extension
        const publicId = pathAfterUpload.replace(/\.[^.]+$/, '');
        return publicId || null;
        
    } catch (error) {
        logger.error({ error }, "Error extracting public_id from URL");
        return null;
    }
};


const deleteFromCloudinary = async (image_url) => {
    try {
        if(!image_url){
            throw new ApiError(400, "Image URL is required")
        }

        const public_id = extractPublicIdFromUrl(image_url);
        if (!public_id) {
            throw new ApiError(400, "Invalid Cloudinary URL format");
        }
        logger.info({ public_id }, "Attempting to delete file with public_id");
        // delete from cloudinary
        logger.info({ public_id }, "Starting Cloudinary delete operation");
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: "image"
        })
        return response
        
    } catch (error) {
        logger.error({ error }, "Error while deleting file from cloudinary");
        throw new ApiError(500, "Error while deleting file from cloudinary");
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}