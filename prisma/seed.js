import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const cats = [
    { name: "Ayakkabı",   slug: "ayakkabi" },
    { name: "Yağmurluk",  slug: "yagmurluk" },
    { name: "Ceket",      slug: "ceket" },
  ]
  for (const c of cats) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    })
  }
  console.log("Categories seeded.")
}

main().finally(()=>prisma.$disconnect())
