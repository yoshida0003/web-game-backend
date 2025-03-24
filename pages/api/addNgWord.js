import { PrismaClient } from "@prisma/client";
import verifyToken from "./verifyTokenMiddleware.js"; 

const prisma = new PrismaClient();

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "メソッドが許可されていません。" });
  }

  const { word } = req.body;

  try {
    const newNgWord = await prisma.ngWord.create({
      data: {
        word,
      },
    });
    res.status(201).json(newNgWord);
  } catch (error) {
    res
      .status(500)
      .json({ message: "NGワードの追加中にエラーが発生しました。", error });
  }
};

export default verifyToken(handler);
