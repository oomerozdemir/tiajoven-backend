import { Router } from "express"
import { getMe, updateMe } from "../controllers/user.controller.js"
import { verifyToken } from "../utils/authMiddleware.js"

const router = Router()

router.get("/me", verifyToken, getMe)
router.put("/me", verifyToken, updateMe)

export default router
