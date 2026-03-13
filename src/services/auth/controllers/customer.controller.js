import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { options } from "../../../constants.js";
import { Customer } from "../models/customer.model.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import {
  create_access_token,
  create_refresh_token,
  generateUsername,
  isPasswordCorrect,
} from "../../../utils/helper.js";
import { UserStatus } from "../../../constants.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone_number, country_code, password, gender, dateOfBirth, bio } = req.body;

  // Validate required fields
  if ([name, email, phone_number, country_code, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Name, email, phone, and password are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Email is not valid");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  // Check if customer already exists
  const existing_user = await Customer.findOne({ email: email });
  if (existing_user) {
    throw new ApiError(409, "Customer already exists with this email");
  }

  // Generate username
  let user_name;
  try {
    user_name = generateUsername(name);
  } catch (err) {
    if (err.code === 11000) {
      console.warn("Username collision detected, retrying...");
      user_name = generateUsername(name);
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashed_password = await bcrypt.hash(password, salt);

  // Create new customer with profile
  const new_user = await Customer.create({
    name: name,
    user_name: user_name,
    email: email,
    phone_number: phone_number,
    country_code: country_code,
    password: hashed_password,
    status: UserStatus.PENDING,
    gender: gender || null,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    bio: bio || null,
    isVerified: false,
    isApproved: false,
    // Initialize empty customer profile
    customerProfile: {
      vehicles: [],
      addresses: [],
      preferences: {
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        preferredLanguage: "en",
        theme: "light",
        privacyLevel: "private",
      },
      stats: {
        totalSwaps: 0,
        totalSpent: 0,
        favoriteStationCount: 0,
        averageWaitTime: 0,
        reliabilityScore: 0,
        streakDays: 0,
      },
      subscriptionPlan: "free",
      paymentMethods: [],
    },
  });

  if (!new_user) {
    throw new ApiError(500, "Customer registration failed");
  }

  // Generate tokens
  const access_token = create_access_token(new_user._id, new_user.user_name);
  const refresh_token = create_refresh_token(new_user._id);

  // Hash and store refresh token
  const hashed_refresh_token = await bcrypt.hash(refresh_token, salt);
  new_user.refresh_token = hashed_refresh_token;
  await new_user.save({ validateBeforeSave: false });

  // Prepare response data
  const user_data = new_user.toObject();
  delete user_data.refresh_token;
  delete user_data.password;

  // Send welcome email
  try {
    const email_subject = "Welcome to NavSwap - Your Customer Account";
    const email_content = `
      <h1>Welcome to NavSwap!</h1>
      <p>Dear ${name},</p>
      <p>Your customer account has been successfully created.</p>
      <p>You can now start using our battery swap services.</p>
      <p>Best regards,<br/>NavSwap Team</p>
    `;
    // await sendEmail(email, email_subject, email_content);
    console.log("Email would be sent to:", email);
  } catch (err) {
    console.error("Error sending email:", err);
  }

  return res
    .status(201)
    .cookie("access_token", access_token, options)
    .cookie("refresh_token", refresh_token, options)
    .json(
      new ApiResponse(
        201,
        {
          user: user_data,
          access_token: access_token,
          refresh_token: refresh_token,
        },
        "Customer registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, user_name, password } = req.body;

  if (!user_name && !email) {
    throw new ApiError(400, "Customer name or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  let user;

  if (user_name) {
    user = await Customer.findOne({ user_name: user_name });
    if (!user) {
      throw new ApiError(404, "Customer not found with this user name");
    }
  } else if (email) {
    user = await Customer.findOne({ email: email });
    if (!user) {
      throw new ApiError(404, "Customer not found with this email");
    }
  }

  const is_password_correct = await isPasswordCorrect(password, user.password);
  if (!is_password_correct) {
    throw new ApiError(401, "Invalid password");
  }

  // Generate tokens
  const access_token = create_access_token(user._id, user.user_name);
  const refresh_token = create_refresh_token(user._id);

  // Hash and store refresh token
  const salt = await bcrypt.genSalt(10);
  const hashed_refresh_token = await bcrypt.hash(refresh_token, salt);
  user.refresh_token = hashed_refresh_token;
  user.lastLoginAt = new Date().toLocaleString();
  await user.save({ validateBeforeSave: false });

  // Prepare response data
  const user_data = user.toObject();
  delete user_data.refresh_token;
  delete user_data.password;

  return res
    .status(200)
    .cookie("access_token", access_token, options)
    .cookie("refresh_token", refresh_token, options)
    .json(
      new ApiResponse(
        200,
        {
          user: user_data,
          access_token: access_token,
          refresh_token: refresh_token,
        },
        "Customer logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  await Customer.findByIdAndUpdate(
    user._id,
    {
      $unset: {
        refresh_token: 1,
      },
    },
    {
      new: true,
    }
  );

  console.log("Customer logged out successfully:", user.user_name);
  return res
    .status(200)
    .clearCookie("access_token", options)
    .clearCookie("refresh_token", options)
    .json(new ApiResponse(200, {}, "Customer logged out successfully"));
});

const refresh_access_token = asyncHandler(async (req, res) => {
  const incoming_refresh_token =
    req.cookies?.refresh_token ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!incoming_refresh_token) {
    throw new ApiError(401, "Unauthorized request, refresh token is required");
  }

  try {
    const decoded_info = jwt.verify(
      incoming_refresh_token,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await Customer.findById(decoded_info?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    const is_refresh_token_valid = await bcrypt.compare(
      incoming_refresh_token,
      user.refresh_token
    );
    if (!is_refresh_token_valid) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    // Generate new tokens
    const access_token = create_access_token(user._id, user.user_name);
    const refresh_token = create_refresh_token(user._id);

    // Hash and store new refresh token
    const salt = await bcrypt.genSalt(10);
    const hashed_refresh_token = await bcrypt.hash(refresh_token, salt);
    user.refresh_token = hashed_refresh_token;
    await user.save({ validateBeforeSave: false });

    // Prepare response data
    const user_data = user.toObject();
    delete user_data.refresh_token;
    delete user_data.password;

    return res
      .status(200)
      .cookie("access_token", access_token, options)
      .cookie("refresh_token", refresh_token, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user_data,
            access_token: access_token,
            refresh_token: refresh_token,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { new_password, confirm_password, email, user_name } = req.body;

  if (!new_password || !confirm_password) {
    throw new ApiError(400, "Password and confirm password are required");
  }

  if (!user_name && !email) {
    throw new ApiError(400, "Customer name or email is required");
  }

  if (new_password !== confirm_password) {
    throw new ApiError(400, "Passwords don't match");
  }

  if (new_password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  let existing_user;

  if (email) {
    existing_user = await Customer.findOne({ email: email });
  } else if (user_name) {
    existing_user = await Customer.findOne({ user_name: user_name });
  }

  if (!existing_user) {
    throw new ApiError(404, "Customer doesn't exist");
  }

  const is_same_password = await isPasswordCorrect(
    new_password,
    existing_user.password
  );
  if (is_same_password) {
    throw new ApiError(
      400,
      "New password can't be same as old password, kindly choose a new password"
    );
  }

  existing_user.password = new_password;
  await existing_user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user: user }, "Current user fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refresh_access_token,
  changeCurrentPassword,
  getCurrentUser
};