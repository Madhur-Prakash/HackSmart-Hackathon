import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../../../utils/cloudinary.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { full_name, email, bio, gender, dateOfBirth } = req.body;

  if (!full_name || !email) {
    throw new ApiError(400, "Full Name and email are required");
  }

  const user = req.user;
  user.full_name = full_name;
  user.email = email;
  if (bio) user.bio = bio;
  if (gender) user.gender = gender;
  if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);

  await user.save({ validateBeforeSave: false });

  const user_data = user.toObject();
  delete user_data.refresh_token;
  delete user_data.password;

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: user_data }, "Customer details updated successfully")
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

  if (user.profileImage) {
    console.log("Deleting old avatar from cloudinary:", user.profileImage);
    try {
      await deleteFromCloudinary(user.profileImage);
      console.log("Old avatar deleted successfully");
    } catch (err) {
      console.error("Error deleting old avatar:", err);
    }
  }

  user.profileImage = avatar.url;
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
        "Customer avatar updated successfully"
      )
    );
});

const updateCustomerProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const {
    vehicles,
    addresses,
    defaultAddress,
    preferences,
    subscriptionPlan,
    paymentMethods,
    defaultPaymentMethod,
  } = req.body;

  // Initialize customerProfile if it doesn't exist
  if (!user.customerProfile) {
    user.customerProfile = {
      vehicles: [],
      addresses: [],
      preferences: {},
      stats: {},
      paymentMethods: [],
    };
  }

  if (vehicles !== undefined) {
    user.customerProfile.vehicles = vehicles;
  }
  if (addresses !== undefined) {
    user.customerProfile.addresses = addresses;
  }
  if (defaultAddress !== undefined) {
    user.customerProfile.defaultAddress = defaultAddress;
  }
  if (preferences !== undefined) {
    user.customerProfile.preferences = {
      ...user.customerProfile.preferences,
      ...preferences,
    };
  }
  if (subscriptionPlan !== undefined) {
    user.customerProfile.subscriptionPlan = subscriptionPlan;
  }
  if (paymentMethods !== undefined) {
    user.customerProfile.paymentMethods = paymentMethods;
  }
  if (defaultPaymentMethod !== undefined) {
    user.customerProfile.defaultPaymentMethod = defaultPaymentMethod;
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
        "Customer profile updated successfully"
      )
    );
});

export {
    updateAccountDetails,
    updateUserAvatar,
    updateCustomerProfile
}