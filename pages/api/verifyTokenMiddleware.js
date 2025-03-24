import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (handler) => {
  return async (req, res) => {
    const token = req.headers["authorization"];

    if (!token) {
      return res
        .status(403)
        .json({ message: "トークンが提供されていません。" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      return handler(req, res);
    } catch (error) {
      console.error("❌ JWTの検証に失敗しました:", error.message);
      return res.status(401).json({ message: "トークンが無効です。" });
    }
  };
};

export default verifyToken;
