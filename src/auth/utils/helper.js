import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiError } from "./ApiError.js";

const isPasswordCorrect = async function(password, hashed_password){
    try {
        return (await bcrypt.compare(password, hashed_password))
    } catch (error) {
        throw new ApiError(500, "Error while comparing password", error);
    }
}

const create_access_token = function(id, data){
    const acces_token = jwt.sign(
        {
            _id: id,
            extra_data: data
        },
        process.env.ACESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACESS_TOKEN_EXPIRY
        }
    )
    return acces_token;
}

const create_refresh_token = function(id){
    const refresh_token = jwt.sign(
        {
            _id: id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
    return refresh_token;
}

export { create_access_token, create_refresh_token, isPasswordCorrect };