import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";


const StationHealthCheck = asyncHandler(async (req, res) => {
    try {
        return res.json(new ApiResponse(
            200,
            {
                "api_version": "1.0.0",
                "status": "healthy",
                "uptime": process.uptime().toFixed(2) + " seconds",
                "timestamp": new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            },
            "Station Service is healthy"
            ))
    } catch (error) {
        throw new ApiError(500, "Station Service Healthcheck failed")
    }
})

export {
    StationHealthCheck
    }
    