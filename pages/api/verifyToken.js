import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "トークンが提供されていません。" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.status(200).json({ message: "トークンが有効です。", decoded });
    } catch (error) {
      console.error("❌ JWTの検証に失敗しました:", error.message);
      return res.status(401).json({ message: "トークンが無効です。" });
    }
  } else {
    return res.status(405).json({ message: "メソッドが許可されていません。" });
  }
}
