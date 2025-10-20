import { Router } from "express"
import { verifyToken } from "../utils/authMiddleware.js"
import { toggleFavorite, getFavorites } from "../controllers/favorite.controller.js"

const router = Router()

router.post("/:productId", verifyToken, toggleFavorite)
router.get("/", verifyToken, getFavorites)

export default router
