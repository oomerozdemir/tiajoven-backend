import jwt from "jsonwebtoken"

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = headerToken || req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ message: "Yetkilendirme hatası: token yok" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    return next();
  } catch (err) {
    const reason = err?.name === "TokenExpiredError"
      ? "Token süresi dolmuş"
      : "Geçersiz token";
    return res.status(403).json({ message: reason });
  }
};