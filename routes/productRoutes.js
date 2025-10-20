import { Router } from "express"
import { verifyToken } from "../utils/authMiddleware.js"
import { requireAdmin } from "../utils/requireAdmin.js"
import { createProduct, listProducts, getProduct, updateProduct, deleteProduct,getProductsByCategory,
} from "../controllers/product.controller.js"

const router = Router()

// public
router.get("/category/:slug", getProductsByCategory) 

router.get("/", listProducts)
router.get("/:id", getProduct)

// admin
router.post("/", verifyToken, requireAdmin, createProduct)
router.put("/:id", verifyToken, requireAdmin, updateProduct)
router.delete("/:id", verifyToken, requireAdmin, deleteProduct)

export default router
