import { Router } from "express";
import { 
    updateAccountDetails,
    updateUserAvatar
} from "../controllers/company.controller.js";
import { CompanyJWTVerify } from "../../../middlewares/auth.middleware.js";
import { upload } from "../../../middlewares/multer.middleware.js";

const router = Router()

// secure routes
router.route("/update_account_details").patch(CompanyJWTVerify, updateAccountDetails)
router.route("/update_avatar").patch(CompanyJWTVerify, upload.single("avatar"), updateUserAvatar)


export default router