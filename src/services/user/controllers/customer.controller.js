import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../../../utils/cloudinary.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, bio, phone_number, country_code, gender, dateOfBirth } = req.body;

  if ( !email) {
    throw new ApiError(400, "Email is required");
  }

  const user = req.user;
  user.email = email;

  // check for only once changeable fields and if they are being updated then throw error
  if (user.dateOfBirth !== null) {
    throw new ApiError(400, "Date of Birth cannot be changed once set");
  }
  if (user.gender !== null) {
    throw new ApiError(400, "Gender cannot be changed once set");
  }

  // set the updated fields
  if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
  if (gender) user.gender = gender;
  if (bio) user.bio = bio;
  if (phone_number && !country_code) {
          throw new ApiError(400, "Country code is required when phone number is provided")
      }
  if (phone_number) user.phone_number = phone_number;
  if (country_code) user.country_code = country_code;

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