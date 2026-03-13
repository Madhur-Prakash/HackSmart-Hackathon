import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar,
} from "../controllers/staff.controller.js";
import { StaffJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

// secure routes
router.route("/update_account_details").patch(StaffJWTVerify, updateAccountDetails)
router.route("/update_avatar").patch(StaffJWTVerify, upload.single("avatar"), updateUserAvatar)

export default router