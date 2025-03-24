import { PrismaClient } from "@prisma/client";
import verifyToken from "./verifyTokenMiddleware.js";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "メソッドが許可されていません。" });
  }

  const { ngWords } = req.body;

  try {
    const newNgWords = await prisma.ngWord.createMany({
      data: ngWords.map((word) => ({
        word,
      })),
    });
    res.status(201).json(newNgWords);
  } catch (error) {
    res.status(500).json({
      message: "NGワードのインポート中にエラーが発生しました。",
      error,
    });
  }
};

export default verifyToken(handler);
