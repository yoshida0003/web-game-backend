import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generateRandomId(length) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({ message: "全て入力してください！" });
    }

    if (
      password.length < 8 ||
      password.length > 12 ||
      !/\d/.test(password) ||
      !/[a-zA-Z]/.test(password)
    ) {
      return res
        .status(400)
        .json({
          message:
            "パスワードは8〜12文字で、少なくとも1つの数字と1つの英字を含む必要があります。",
        });
    }

    if (nickname.length > 10) {
      return res
        .status(400)
        .json({ message: "ニックネームは10文字以内である必要があります。" });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "このメールアドレスは既に登録されています。" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = generateRandomId(6);

      const user = await prisma.user.create({
        data: {
          id: userId,
          email,
          password: hashedPassword,
          nickname,
          shogi_rating: 1500,
        },
      });
      res.status(201).json({ message: "ユーザー登録が成功しました。" });
    } catch (error) {
      console.error("❌ サーバーでエラー発生:", error);
      res
        .status(500)
        .json({ message: "ユーザー登録中にエラーが発生しました。" });
    }
  } else {
    res.status(405).json({ message: "メソッドが許可されていません。" });
  }
}
