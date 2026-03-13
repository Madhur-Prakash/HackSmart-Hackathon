import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refresh_access_token, 
    registerUser, 
    getCurrentUser, 
    changeCurrentPassword,} from "../controllers/staff.controller.js";
import { StaffJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(registerUser)

// public routes
router.route("/login").post(loginUser) // no middleware
router.route("/refresh_access_token").post(refresh_access_token)
router.route("/change_password").post(changeCurrentPassword)


// secure routes
router.route("/logout").post(StaffJWTVerify, logoutUser)
router.route("/current_user").get(StaffJWTVerify, getCurrentUser)

export default router