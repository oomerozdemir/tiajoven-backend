import { prisma } from "../prismaClient.js"

// ➕ Favori ekle / kaldır (toggle)
export const toggleFavorite = async (req, res) => {
  const userId = req.user.id;
  const productId = Number(req.params.productId);

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_productId: { userId, productId } }, // <-- id yerine composite key
      });
      return res.json({ message: "Favorilerden kaldırıldı", favorite: false });
    }

    await prisma.favorite.create({ data: { userId, productId } });
    res.json({ message: "Favorilere eklendi", favorite: true });
  } catch (err) {
    console.error("toggleFavorite error:", err);
    res.status(500).json({ message: "Bir hata oluştu" });
  }
};

// 📜 Kullanıcının favorilerini getir
export const getFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      select: { productId: true },
    })
    res.json(favorites.map(f => f.productId))
  } catch (err) {
    console.error("getFavorites error:", err)
    res.status(500).json({ message: "Favoriler alınamadı" })
  }
}
