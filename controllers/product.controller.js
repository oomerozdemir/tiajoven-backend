import { prisma } from "../prismaClient.js"
import cloudinary from "../lib/cloudinary.js" 

const toSlug = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")


export const createProduct = async (req, res) => {
  try {
    const {
      title,
      // price,  // <- FE göndermiyor; yok sayıyoruz
      description,
      sizes,
      imageUrl,
      imagePublicId,
      categoryId,
      isFeatured,
    } = req.body || {}

    if (!title?.trim()) {
      return res.status(400).json({ message: "Başlık zorunludur." })
    }

    // Kategori kontrolü
    const catId = Number(categoryId)
    if (!catId || Number.isNaN(catId)) {
      return res.status(400).json({ message: "Geçerli bir kategori seçin." })
    }
    const cat = await prisma.category.findUnique({ where: { id: catId } })
    if (!cat) return res.status(400).json({ message: "Seçilen kategori bulunamadı." })

    // 💡 Fiyat FE tarafından kaldırıldığı için 0 kaydediyoruz
    const item = await prisma.product.create({
      data: {
        title: title.trim(),
        slug: toSlug(title),
        price: 0, // 👈 DB Int zorunluluğu için güvenli default
        description: description ?? "",
        sizes: sizes ?? "",
        imageUrl: imageUrl ?? null,
        imagePublicId: imagePublicId ?? null,
        isFeatured: Boolean(isFeatured),
        categoryId: catId,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    res.status(201).json(item)
  } catch (err) {
    console.error("createProduct error:", err)
    res.status(500).json({ message: "Ürün oluşturulamadı." })
  }
}


export const listProducts = async (req, res) => {
  try {
    const { ids, featured } = req.query
    const where = {}

    if (ids) {
      const arr = ids
        .split(",")
        .map(n => Number(n))
        .filter(n => Number.isInteger(n))
      if (arr.length) where.id = { in: arr }
    }

    if (featured === "1" || featured === "true") {
      where.isFeatured = true
    }

    const items = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    res.json(items)
  } catch (err) {
    console.error("listProducts error:", err)
    res.status(500).json({ message: "Ürünler alınamadı" })
  }
}

export const getProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: "Geçersiz id" })

  try {
    const item = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!item) return res.status(404).json({ message: "Bulunamadı" })
    res.json(item)
  } catch (err) {
    console.error("getProduct error:", err)
    res.status(500).json({ message: "Ürün alınamadı" })
  }
}

export const updateProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: "Geçersiz id" })

  try {
    const {
      title,
      // price,                   // <- beklemiyoruz
      description,
      sizes,
      isFeatured,
      categoryId,
      imageUrl,
      imagePublicId,
    } = req.body || {}

    const current = await prisma.product.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ message: "Bulunamadı" })

    // Kategori güncellenecekse kontrol et
    let nextCategoryId
    if (categoryId != null) {
      nextCategoryId = Number(categoryId)
      if (!nextCategoryId || Number.isNaN(nextCategoryId)) {
        return res.status(400).json({ message: "Geçerli bir kategori seçin." })
      }
      const cat = await prisma.category.findUnique({ where: { id: nextCategoryId } })
      if (!cat) return res.status(400).json({ message: "Kategori bulunamadı." })
    }

    const data = {
      ...(title != null ? { title: title.trim(), slug: toSlug(title) } : {}),
      // ...(price != null ? { price: parsedPrice } : {}), // <- kaldırıldı
      ...(description != null ? { description } : {}),
      ...(sizes != null ? { sizes } : {}),
      ...(isFeatured != null ? { isFeatured: Boolean(isFeatured) } : {}),
      ...(categoryId != null ? { categoryId: nextCategoryId } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(imagePublicId !== undefined ? { imagePublicId } : {}),
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    // Görsel değiştiyse eskisini sil
    if (current?.imagePublicId && imagePublicId && current.imagePublicId !== imagePublicId) {
      try { await cloudinary.uploader.destroy(current.imagePublicId) }
      catch (e) { console.warn("Cloudinary destroy warn:", e?.message || e) }
    }

    res.json(updated)
  } catch (err) {
    console.error("updateProduct error:", err)
    res.status(500).json({ message: "Ürün güncellenemedi" })
  }
}


export const deleteProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: "Geçersiz id" })

  try {
    const current = await prisma.product.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ message: "Bulunamadı" })

    await prisma.product.delete({ where: { id } })

    if (current?.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(current.imagePublicId)
      } catch (e) {
        console.warn("Cloudinary destroy warn:", e?.message || e)
      }
    }
    res.json({ ok: true })
  } catch (err) {
    console.error("deleteProduct error:", err)
    res.status(500).json({ message: "Ürün silinemedi" })
  }
}


// Kategori slug'ına göre ürün getir
export const getProductsByCategory = async (req, res) => {
  const { slug } = req.params
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true }
    })
    if (!category) return res.status(404).json({ message: "Kategori bulunamadı" })

    const items = await prisma.product.findMany({
      where: { categoryId: category.id },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    res.json({ category, items })
  } catch (err) {
    console.error("getProductsByCategory error:", err)
    res.status(500).json({ message: "Ürünler alınamadı" })
  }
}