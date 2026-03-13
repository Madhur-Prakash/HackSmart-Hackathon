import { Router } from "express";
import {
    updateAccountDetails,
    updateTransporterProfile,
    updateUserAvatar
} from "../controllers/transporter.controller.js";
import {upload} from "../../../middlewares/multer.middleware.js"
import { TransporterJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

// secure routes
router.route("/update_account_details").patch(TransporterJWTVerify, updateAccountDetails)
router.route("/update_avatar").patch(TransporterJWTVerify, upload.single("avatar"), updateUserAvatar)
router.route("/update_profile").patch(TransporterJWTVerify, updateTransporterProfile)

export default router