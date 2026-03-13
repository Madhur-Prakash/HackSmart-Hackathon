import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { options } from "../../../constants.js";
import { Transporter } from "../models/transporter.model.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import {
    create_access_token,
    create_refresh_token,
    generateUsername,
    isPasswordCorrect,
    sendEmail,
} from "../../../utils/helper.js";
import { UserStatus, TransporterTier, VerificationStatus } from "../../../constants.js";

const registerUser = asyncHandler(async (req, res) => {
  const { full_name, email, phone_number, country_code, password, driving_license_number, gender, dateOfBirth, bio } = req.body;

  // Validate required fields
  if ([full_name, email, phone_number, country_code, password, driving_license_number].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Full name, email, phone number, country code, password, and driving license are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Email is not valid");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  if (driving_license_number.length !== 15) {
    throw new ApiError(400, "Driving license number must be exactly 15 characters long");
  }

  // Check if transporter already exists
  const existing_user = await Transporter.findOne({ email: email });
  if (existing_user) {
    throw new ApiError(409, "Transporter already exists with this email");
  }

  // Generate username
  let user_name;
  try {
    user_name = generateUsername(full_name);
  } catch (err) {
    if (err.code === 11000) {
      console.warn("Username collision detected, retrying...");
      user_name = generateUsername(full_name);
    }
  }

  // Create new transporter with profile (password will be hashed by pre-save hook)
  const new_user = await Transporter.create({
    full_name: full_name,
    user_name: user_name,
    email: email,
    phone_number: phone_number,
    country_code: country_code,
    password: password, // Will be hashed by pre-save hook
    driving_license_number: driving_license_number,
    status: UserStatus.PENDING,
    gender: gender || null,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    bio: bio || null,
    isVerified: false,
    isApproved: false,
    // Initialize empty transporter profile
    transporterProfile: {
      tier: TransporterTier.BRONZE,
      stats: {
        totalEarnings: 0.0,
        totalDeliveries: 0,
        efficiencyScore: 0.0,
        onTimePercentage: 0.0,
        todayDeliveries: 0,
        todayEarnings: 0.0,
        averageRating: 0.0,
        totalRatings: 0,
        cancelledTasks: 0,
        rejectedTasks: 0,
      },
      verification: {
        idVerification: VerificationStatus.PENDING,
        vehicleVerification: VerificationStatus.PENDING,
        backgroundCheck: VerificationStatus.PENDING,
      },
      preferences: {
        enableNotifications: true,
        enableLocationTracking: true,
        notificationChannels: ["push"],
        autoAcceptTasks: false,
        minTaskReward: 0.0,
        maxTaskDistanceKm: 50.0,
        preferredAreas: [],
        languageCode: "en",
        theme: "auto",
        shareLocationWithCustomers: true,
        offlineDuringBreaks: true,
      },
      isAvailable: false,
      isOnline: false,
      walletBalance: 0.0,
      certifications: [],
    },
  });

  if (!new_user) {
    throw new ApiError(500, "Transporter registration failed");
  }

  // Generate tokens
  const access_token = create_access_token(new_user._id, new_user.user_name);
  const refresh_token = create_refresh_token(new_user._id);

  // Hash and store refresh token
  const salt = await bcrypt.genSalt(10);
  const hashed_refresh_token = await bcrypt.hash(refresh_token, salt);
  new_user.refresh_token = hashed_refresh_token;
  await new_user.save({ validateBeforeSave: false });

  // Prepare response data
  const user_data = new_user.toObject();
  delete user_data.refresh_token;
  delete user_data.password;

  // Send welcome email
  try {
    const email_subject = "Welcome to NavSwap - Your Transporter Account";
    const email_content = `
      <h1>Welcome to NavSwap!</h1>
      <p>Dear ${full_name},</p>
      <p>Your transporter account has been successfully created.</p>
      <p>Please complete your verification process to start accepting deliveries.</p>
      <p>Best regards,<br/>NavSwap Team</p>
    `;
    await sendEmail(email, email_subject, email_content);
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
        "Transporter registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, user_name, password } = req.body;

  if (!user_name && !email) {
    throw new ApiError(400, "Transporter name or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  let user;

  if (user_name) {
    user = await Transporter.findOne({ user_name: user_name });
    if (!user) {
      throw new ApiError(404, "Transporter not found with this user name");
    }
  } else if (email) {
    user = await Transporter.findOne({ email: email });
    if (!user) {
      throw new ApiError(404, "Transporter not found with this email");
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
  user.lastLoginAt = new Date();
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
        "Transporter logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  await Transporter.findByIdAndUpdate(
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

  console.log("Transporter logged out successfully:", user.user_name);
  return res
    .status(200)
    .clearCookie("access_token", options)
    .clearCookie("refresh_token", options)
    .json(new ApiResponse(200, {}, "Transporter logged out successfully"));
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

    const user = await Transporter.findById(decoded_info?._id);
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
    throw new ApiError(400, "Transporter name or email is required");
  }

  if (new_password !== confirm_password) {
    throw new ApiError(400, "Passwords don't match");
  }

  if (new_password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  let existing_user;

  if (email) {
    existing_user = await Transporter.findOne({ email: email });
  } else if (user_name) {
    existing_user = await Transporter.findOne({ user_name: user_name });
  }

  if (!existing_user) {
    throw new ApiError(404, "Transporter doesn't exist");
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