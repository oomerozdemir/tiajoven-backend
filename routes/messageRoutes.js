import { Router } from "express"
import { verifyToken} from "../utils/authMiddleware.js"
import {requireAdmin} from "../utils/requireAdmin.js"
import {
  createMessage,
  getMessages,
  markMessageRead,
  deleteMessage,
} from "../controllers/message.controller.js"

const router = Router()

// public
router.post("/", createMessage)


// admin
router.get("/", verifyToken, requireAdmin, getMessages)
router.patch("/:id/read", verifyToken, requireAdmin, markMessageRead)
router.delete("/:id", verifyToken, requireAdmin, deleteMessage)

export default router
