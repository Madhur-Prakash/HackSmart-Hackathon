import e, { Router } from "express";
import { createStation } from "../controllers/station.controller.js";
import { CompanyJWTVerify } from "../../../middlewares/auth.middleware.js";

const router = Router()

router.route("/create").post(CompanyJWTVerify, createStation)

export default router