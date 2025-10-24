// routes/sitemapRoutes.js  (ESM)
import express from "express";
import { prisma } from "../prismaClient.js";   // <-- EKLENDİ: named import
const router = express.Router();

const BASE = process.env.SITE_URL || "https://www.tiajoven.com";

const toYMD = (d) => {
  try { return new Date(d).toISOString().slice(0, 10); } catch { return null; }
};

router.get("/sitemap.xml", async (req, res) => {
  try {
    const staticUrls = [
      { loc: `${BASE}/`, priority: "1.0" },
      { loc: `${BASE}/urunler`, priority: "0.9" },
      { loc: `${BASE}/kategori`, priority: "0.9" },
    ];

    const cats = await prisma.category.findMany({
      select: { slug: true },
      orderBy: { slug: "asc" },
    });

    const today = toYMD(Date.now());
    const categoryUrls = cats.map((c) => ({
      loc: `${BASE}/kategori/${c.slug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.8",
    }));

    const urlTag = (u) => `
  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ""}
    ${u.priority ? `<priority>${u.priority}</priority>` : ""}
  </url>`;

    const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(urlTag).join("")}${categoryUrls.map(urlTag).join("")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(xml);
  } catch (e) {
    console.error("sitemap.xml üretilemedi:", e);
    return res.status(500).send("Sitemap error");
  }
});

export default router;
