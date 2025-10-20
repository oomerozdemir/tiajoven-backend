import { Router } from "express"
import { verifyToken } from "../utils/authMiddleware.js"
import { requireAdmin } from "../utils/requireAdmin.js"
import crypto from "crypto"

const router = Router()

router.get("/sign", verifyToken, requireAdmin, (req, res) => {
  const timestamp = Math.round((new Date).getTime() / 1000)
  const paramsToSign = `folder=tiajoven/products&timestamp=${timestamp}`

  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex")

  res.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: "tiajoven/products",
  })
})

export default router
