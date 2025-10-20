import { prisma } from "../prismaClient.js"

const toSlug = (s) =>
  s.toString().toLowerCase().trim()
   .replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s")
   .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c")
   .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")

export const listCategories = async (req, res) => {
  try {
    const items = await prisma.category.findMany({
      orderBy: { name: "asc" },
      // İstersen include ile product sayısı döndürebiliriz:
      // include: { _count: { select: { products: true } } }
    })
    res.json(items)
  } catch (e) {
    res.status(500).json({ message: "Kategoriler yüklenemedi" })
  }
}

export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, imageUrl, imagePublicId } = req.body || {}
    if (!name?.trim()) return res.status(400).json({ message: "Ad gerekli" })
    const data = {
      name: name.trim(),
      slug: slug?.trim() || toSlug(name),
      ...(description !== undefined ? { description } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(imagePublicId !== undefined ? { imagePublicId } : {}),
    }
    const cat = await prisma.category.create({ data })
    res.status(201).json(cat)
  } catch (err) {
    console.error("createCategory error:", err)
    if (err.code === "P2002") return res.status(409).json({ message: "Aynı isim/slug zaten var." })
    res.status(500).json({ message: "Kategori oluşturulamadı" })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, slug, description, imageUrl, imagePublicId } = req.body || {}

    const data = {
      ...(name != null ? { name: name.trim() } : {}),
      ...(slug  != null ? { slug: slug.trim() || toSlug(name||"") } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(imagePublicId !== undefined ? { imagePublicId } : {}),
    }

    const updated = await prisma.category.update({ where: { id }, data })
    res.json(updated)
  } catch (err) {
    console.error("updateCategory error:", err)
    if (err.code === "P2002") return res.status(409).json({ message: "Aynı isim/slug zaten var." })
    res.status(500).json({ message: "Kategori güncellenemedi" })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ message: "Geçersiz id" })

    // Güvenli silme: kategoride ürün var mı?
    const cnt = await prisma.product.count({ where: { categoryId: id } })
    if (cnt > 0) {
      return res.status(400).json({ message: "Bu kategoriye bağlı ürünler var. Önce ürünleri taşıyın/silin." })
    }

    await prisma.category.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: "Kategori silinemedi" })
  }
}
