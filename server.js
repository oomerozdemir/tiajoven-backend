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
import sitemapRoutes from "./routes/sitemapRoutes.js"

dotenv.config();

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

/* ---------- Security & Perf ---------- */
app.disable("x-powered-by");
app.use(helmet());
app.use(compression());

/* ---------- CORS ---------- */
const STATIC_ALLOWED = [
  "http://localhost:5173",
  "https://tiajoven.com",
  "https://www.tiajoven.com",
  "https://tiajoven-frontend.vercel.app",
];

const ENV_ALLOWED = (process.env.CORS_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

const ALLOWED = [...new Set([...STATIC_ALLOWED, ...ENV_ALLOWED])];
const allowAll = String(process.env.CORS_ALLOW_ALL || "").toLowerCase() === "true";

const corsOrigin = (origin, cb) => {
  if (!origin) return cb(null, true);              // server-to-server / Postman
  if (allowAll) return cb(null, true);

  try {
    const host = new URL(origin).hostname;
    if (ALLOWED.includes(origin)) return cb(null, true);
    if (/\.vercel\.app$/i.test(host)) return cb(null, true); // preview’ler
    if (host === "tiajoven.com" || host === "www.tiajoven.com") return cb(null, true);
  } catch {}
  return cb(new Error("Not allowed by CORS"));
};

app.use(cors({
  origin: corsOrigin,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Health ---------- */
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, env: NODE_ENV });
  } catch {
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
app.use("/api", sitemapRoutes);

/* ---------- 404 & Error handler ---------- */
app.use((req, res) => res.status(404).json({ message: "Not Found" }));
app.use((err, req, res, next) => {
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS: Origin not allowed" });
  }
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
