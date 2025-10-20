import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../prismaClient.js"

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"

// ✅ Kayıt ol
export const registerUser = async (req, res) => {
  try {
    const { email, password, isEmailAllowed } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: "E-posta ve şifre zorunludur." })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: "Bu e-posta zaten kayıtlı." })
    }

    const hashed = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashed,
        isEmailAllowed: Boolean(isEmailAllowed),
      },
    })

    res.status(201).json({
      message: "Kayıt başarılı.",
      user: {
        id: newUser.id,
        email: newUser.email,
        isEmailAllowed: newUser.isEmailAllowed,
        isAdmin: newUser.isAdmin ?? false,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Sunucu hatası" })
  }
}

// ✅ Giriş yap
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ message: "Geçersiz e-posta veya şifre." })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ message: "Geçersiz e-posta veya şifre." })

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isEmailAllowed: user.isEmailAllowed,
        isAdmin: user.isAdmin === true, // FE -> user?.isAdmin
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Sunucu hatası" })
  }
}
