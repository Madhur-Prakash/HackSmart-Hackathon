import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar
} from "../controllers/regional_admin.controller.js";
import { CustomerJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

// secure routes
router.route("/update_account_details").patch(CustomerJWTVerify, updateAccountDetails)
router.route("/update_avatar").patch(CustomerJWTVerify, upload.single("avatar"), updateUserAvatar)

export default router