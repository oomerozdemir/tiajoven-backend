import { prisma } from "../prismaClient.js"
import bcrypt from "bcrypt"

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  isAdmin: true,
  createdAt: true,
  name: true,
  phone: true,
  city: true,
}

export const getMe = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Yetkisiz" })

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: PUBLIC_USER_FIELDS,
    })
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" })

    res.json(user)
  } catch (err) {
    console.error("getMe error:", err)
    res.status(500).json({ message: "Profil getirilemedi" })
  }
}

export const updateMe = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Yetkisiz" })
    const { name, phone, city, email, password } = req.body

    const data = {}
    if (name !== undefined) data.name = String(name).trim()
    if (phone !== undefined) data.phone = String(phone).trim()
    if (city !== undefined) data.city = String(city).trim()
    if (email !== undefined) data.email = String(email).trim().toLowerCase()
    if (password) {
      if (String(password).length < 6)
        return res.status(400).json({ message: "Şifre en az 6 karakter olmalı" })
      data.password = await bcrypt.hash(password, 10)
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: PUBLIC_USER_FIELDS,
    })

    res.json(updated)
  } catch (err) {
    console.error("updateMe error:", err)
    if (err.code === "P2002")
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı" })
    res.status(500).json({ message: "Profil güncellenemedi" })
  }
}
