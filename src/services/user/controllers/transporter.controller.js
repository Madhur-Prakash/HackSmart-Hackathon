import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";;
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../../../utils/cloudinary.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, bio, phone_number, country_code } = req.body;

  if ( !email) {
    throw new ApiError(400, "Email is required");
  }

  const user = req.user;
  user.email = email;
  if (bio) user.bio = bio;
  if (phone_number && !country_code) {
        throw new ApiError(400, "Country code is required when phone number is provided")
      }
  if (phone_number) user.phone_number = phone_number;
  if (country_code) user.country_code = country_code;

  // Update legacy fields
  user.full_name = full_name;

  await user.save({ validateBeforeSave: false });

  const user_data = user.toObject();
  delete user_data.refresh_token;
  delete user_data.password;

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: user_data }, "Transporter details updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  console.log("Avatar uploaded:", avatar);
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  if (user.avatar) {
    console.log("Deleting old avatar from cloudinary:", user.avatar);
    try {
      await deleteFromCloudinary(user.avatar);
      console.log("Old avatar deleted successfully");
    } catch (err) {
      console.error("Error deleting old avatar:", err);
    }
  }

  user.avatar = avatar.url;
  user.avatar = avatar.url; // Legacy field
  await user.save({ validateBeforeSave: false });

  const user_data = user.toObject();
  delete user_data.password;
  delete user_data.refresh_token;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user_data },
        "Transporter avatar updated successfully"
      )
    );
});

const updateTransporterProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const {
    tier,
    verification,
    transportVehicle,
    bankDetails,
    preferences,
    isAvailable,
    isOnline,
    certifications,
    emergencyContact,
  } = req.body;

  // Initialize transporterProfile if it doesn't exist
  if (!user.transporterProfile) {
    user.transporterProfile = {
      tier: TransporterTier.BRONZE,
      stats: {},
      verification: {},
      preferences: {},
      isAvailable: false,
      isOnline: false,
      walletBalance: 0,
      certifications: [],
    };
  }

  if (tier !== undefined) {
    user.transporterProfile.tier = tier;
  }
  if (verification !== undefined) {
    user.transporterProfile.verification = {
      ...user.transporterProfile.verification,
      ...verification,
    };
  }
  if (transportVehicle !== undefined) {
    user.transporterProfile.transportVehicle = transportVehicle;
  }
  if (bankDetails !== undefined) {
    user.transporterProfile.bankDetails = bankDetails;
  }
  if (preferences !== undefined) {
    user.transporterProfile.preferences = {
      ...user.transporterProfile.preferences,
      ...preferences,
    };
  }
  if (isAvailable !== undefined) {
    user.transporterProfile.isAvailable = isAvailable;
  }
  if (isOnline !== undefined) {
    user.transporterProfile.isOnline = isOnline;
  }
  if (certifications !== undefined) {
    user.transporterProfile.certifications = certifications;
  }
  if (emergencyContact !== undefined) {
    user.transporterProfile.emergencyContact = emergencyContact;
  }

  user.isProfileCompleted = true;
  await user.save({ validateBeforeSave: false });

  const user_data = user.toObject();
  delete user_data.password;
  delete user_data.refresh_token;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user_data },
        "Transporter profile updated successfully"
      )
    );
});

export {
    updateAccountDetails,
    updateUserAvatar,
    updateTransporterProfile
}