import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    registerUser, 
    getCurrentUser, 
    updateAccountDetails,  
    updateUserAvatar,
    changeCurrentPassword,} from "../controllers/staff.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { JWTVerify } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(registerUser)

// public routes
router.route("/login").post(loginUser) // no middleware
router.route("/refresh_access_token").post(refresh_access_token)
router.route("/change_password").post(changeCurrentPassword)


// secure routes
router.route("/logout").post(JWTVerify, logoutUser)
router.route("/current_user").get(JWTVerify, getCurrentUser)
router.route("/update_account_details").patch(JWTVerify, updateAccountDetails)
router.route("/update_avatar").patch(JWTVerify, upload.single("avatar"), updateUserAvatar)

export default router