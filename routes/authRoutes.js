import { Router } from "express"
import { registerUser, loginUser } from "../controllers/auth.controller.js"
import { verifyToken } from "../utils/authMiddleware.js"
import { prisma } from "../prismaClient.js"

const router = Router()

router.post("/register", registerUser)
router.post("/login", loginUser)

// Token ile kullanıcı bilgisi döner
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, isEmailAllowed: true, createdAt: true },
    })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Sunucu hatası" })
  }
})

export default router
