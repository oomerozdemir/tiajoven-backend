import { Router } from "express"
import { verifyToken } from "../utils/authMiddleware.js"
import { requireAdmin } from "../utils/requireAdmin.js"
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js"

const router = Router()

// Public: listeleme
router.get("/", listCategories)

// Admin: oluştur/güncelle/sil
router.post("/", verifyToken, requireAdmin, createCategory)
router.put("/:id", verifyToken, requireAdmin, updateCategory)
router.delete("/:id", verifyToken, requireAdmin, deleteCategory)

export default router
