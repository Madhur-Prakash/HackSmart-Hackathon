import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar,
    updateCustomerProfile
} from "../controllers/customer.controller.js";
import { CustomerJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

// secure routes
router.route("/update_account_details").patch(CustomerJWTVerify, updateAccountDetails)
router.route("/update_avatar").patch(CustomerJWTVerify, upload.single("avatar"), updateUserAvatar)
router.route("/update_profile").patch(CustomerJWTVerify, updateCustomerProfile)

export default router