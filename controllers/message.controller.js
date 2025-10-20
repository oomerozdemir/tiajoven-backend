import { prisma } from "../prismaClient.js"

// 🔹 Form gönderimi (public)
export async function createMessage(req, res) {
  try {
    const { firstName, lastName, phone, email, subject, message } = req.body || {}
    if (!firstName || !lastName || !phone || !email || !subject || !message) {
      return res.status(400).json({ message: "Zorunlu alanları doldurun." })
    }
    const saved = await prisma.contactMessage.create({
      data: { firstName, lastName, phone, email, subject, message },
    })
    res.status(201).json(saved)
  } catch (err) {
    console.error("createMessage:", err)
    res.status(500).json({ message: "Mesaj kaydedilemedi." })
  }
}

// 🔹 Listele (admin)
export async function getMessages(req, res) {
  try {
    const items = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    })
    res.json(items)
  } catch (err) {
    console.error("getMessages:", err)
    res.status(500).json({ message: "Mesajlar alınamadı." })
  }
}

// 🔹 Okundu işaretle (admin)
export async function markMessageRead(req, res) {
  try {
    const updated = await prisma.contactMessage.update({
      where: { id: String(req.params.id) },
      data: { readAt: new Date() },
    })
    res.json(updated)
  } catch (err) {
    console.error("markMessageRead:", err)
    res.status(500).json({ message: "Güncellenemedi." })
  }
}

// 🔹 Sil (admin)
export async function deleteMessage(req, res) {
  try {
    await prisma.contactMessage.delete({ where: { id: String(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    console.error("deleteMessage:", err)
    res.status(500).json({ message: "Silinemedi." })
  }
}
