import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ensureQrDirectory, generateQrPayload, getQrImagePath, verifyQrToken } from "../../../utils/helper.js";
import fs from "fs";

const generateQr = asyncHandler(async (req, res) => {
  const { data, ttl = 300 } = req.body;

  if (typeof data === "undefined") {
    throw new ApiError(400, "data is required to generate QR");
  }

  const ttlSeconds = Number(ttl);
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new ApiError(400, "ttl must be a positive integer in seconds");
  }

  const { token } = await generateQrPayload(data, ttlSeconds);
  const host = `${req.protocol}://${req.get("host")}`;

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        token,
        qr_url: `/api/v1/qr/image/${token}`,
        verify_url: `${host}/api/v1/qr/verify/${token}`,
        expires_in: ttlSeconds,
      },
      "QR generated successfully"
    )
  );
});

const getQrImage = asyncHandler(async (req, res) => {
  ensureQrDirectory();
  const filePath = getQrImagePath(req.params.token);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "QR not found or expired");
  }

  return res.sendFile(filePath);
});

const verifyQr = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const verification = await verifyQrToken(token);

  if (!verification.isValid) {
    return res.status(410).json(
      new ApiResponse(410, {
        valid: false,
        message: "QR expired or invalid",
      }, "QR expired or invalid")
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        valid: true,
        data: verification.data,
      },
      "QR verified successfully"
    )
  );
});

export { generateQr, getQrImage, verifyQr };
