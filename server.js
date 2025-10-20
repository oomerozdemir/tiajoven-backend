import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import pkg from "@prisma/client"
import authRoutes from "./routes/authRoutes.js"
import favoriteRoutes from "./routes/favoriteRoutes.js"
import cloudinaryRoutes from "./routes/cloudinaryRoutes.js";
import productRoutes from "./routes/productRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"
import { verifyToken } from "./utils/authMiddleware.js"

dotenv.config()

const { PrismaClient } = pkg
const prisma = new PrismaClient()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false })
  }
})

app.use("/api/auth", authRoutes)

app.get("/api/auth/me", verifyToken, (req, res) => {
  res.json(req.user); 
});

app.use("/api/favorites", favoriteRoutes)

app.use("/api/cloudinary", cloudinaryRoutes)

app.use("/api/products", productRoutes)

app.use("/api/categories", categoryRoutes)

app.use("/api/users", userRoutes)

app.use("/api/messages", messageRoutes)

app.listen(process.env.PORT || 5000, () =>
  console.log("✅ API on http://localhost:5000")
);
