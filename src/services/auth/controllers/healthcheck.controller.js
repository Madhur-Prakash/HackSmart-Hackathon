import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";


const AuthHealthCheck = asyncHandler(async (req, res) => {
    try {
        const response = new ApiResponse(200, "Auth Service Healthcheck successful", {status: "OK"})
        res.status(200).json(response)
    } catch (error) {
        throw new ApiError(500, "Auth Service Healthcheck failed", error)
    }
})

export {
    AuthHealthCheck
    }
    