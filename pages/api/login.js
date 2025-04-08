import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "全て入力してください！" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      console.log("取得したユーザー情報:", user);

      if (!user) {
        return res
          .status(400)
          .json({ message: "ユーザーが見つかりませんでした。" });
      }

      console.log("ユーザーパスワード:", user.password);
      console.log("パスワード検証開始");
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("パスワード検証OK:", isPasswordValid);

      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "パスワードが間違っています。" });
      }

      console.log("JWT_SECRET:", JWT_SECRET);
      console.log("JWTの生成前 - user.id:", user.id);
      const token = jwt.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log("JWT生成成功");
      console.log("ユーザーID:", user.id);

      res.status(200).json({
        userId: user.id,
        message: "ログイン成功！",
        token,
        nickname: user.nickname,
        isAdmin: user.isAdmin,
        shogiRate: user.shogi_rating,
      });
    } catch (error) {
      console.log("❌ サーバーでエラー発生:", error);
      res.status(500).json({ message: "ログイン中にエラーが発生しました。", error: error.message, stack: error.stack });
    }

  } else {
    res.status(405).json({ message: "POSTメソッドでアクセスしてください。" });
  }
}
