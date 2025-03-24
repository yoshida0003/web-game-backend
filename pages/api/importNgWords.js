import { PrismaClient } from "@prisma/client";
import verifyToken from "./verifyTokenMiddleware.js";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "メソッドが許可されていません。" });
  }

  const { ngWords } = req.body;

  try {
    // 既存のNGワードを取得
    const existingNgWords = await prisma.ngWord.findMany({
      where: {
        word: {
          in: ngWords,
        },
      },
    });

    // 重複を除外
    const newNgWords = ngWords.filter(
      (word) =>
        !existingNgWords.some((existingWord) => existingWord.word === word)
    );

    if (newNgWords.length === 0) {
      return res
        .status(200)
        .json({ message: "追加する新しいNGワードはありません。" });
    }

    const createdNgWords = await prisma.ngWord.createMany({
      data: newNgWords.map((word) => ({
        word,
      })),
    });

    res.status(201).json(createdNgWords);
  } catch (error) {
    console.error("Error importing NG words:", error); // エラーログを追加
    res.status(500).json({
      message: "NGワードのインポート中にエラーが発生しました。",
      error: error.message, // エラーメッセージを追加
    });
  }
};

export default verifyToken(handler);
