// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import pkg from "@prisma/client";

import authRoutes from "./routes/authRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import cloudinaryRoutes from "./routes/cloudinaryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { verifyToken } from "./utils/authMiddleware.js";

dotenv.config();

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

/* ---------- Security & Perf ---------- */
app.use(helmet());
app.use(compression());

/* ---------- CORS (allow only known origins) ---------- */
const allowed = [
  "http://localhost:5173",                            // dev
  "https://tiajoven-frontend.vercel.app",            // vercel preview/prod
  "https://www.tiajoven.com",                        // custom domain (FE)
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // no origin = same-origin or tools (allow)
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Health ---------- */
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, env: NODE_ENV });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

/* ---------- Routes ---------- */
app.use("/api/auth", authRoutes);
app.get("/api/auth/me", verifyToken, (req, res) => res.json(req.user));
app.use("/api/favorites", favoriteRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

/* ---------- 404 & Error handler ---------- */
app.use((req, res) => res.status(404).json({ message: "Not Found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

/* ---------- Start ---------- */
const server = app.listen(PORT, () => {
  console.log(`✅ API on http://localhost:${PORT} (${NODE_ENV})`);
});

/* ---------- Graceful shutdown ---------- */
const shutdown = async () => {
  console.log("Shutting down…");
  await prisma.$disconnect().catch(() => {});
  server.close(() => process.exit(0));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
