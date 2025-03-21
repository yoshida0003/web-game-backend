import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "全て入力してください！" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "ユーザーが見つかりませんでした。" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "パスワードが間違っています。" });
      }

      const token = jwt.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      res
        .status(200)
        .json({
          message: "ログイン成功！",
          token,
          nickname: user.nickname,
          isAdmin: user.isAdmin,
        });
    } catch (error) {
      console.log("❌ サーバーでエラー発生:", error);
      res.status(500).json({ message: "ログイン中にエラーが発生しました。" });
    }
  } else {
    res.status(405).json({ message: "POSTメソッドでアクセスしてください。" });
  }
}
