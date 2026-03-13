import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";


const healthcheck = asyncHandler(async (req, res) => {
    try {
        const response = new ApiResponse(200, "Healthcheck successful", {status: "OK"})
        res.status(200).json(response)
    } catch (error) {
        throw new ApiError(500, "Healthcheck failed", error)
    }
})

export {
    healthcheck
    }
    