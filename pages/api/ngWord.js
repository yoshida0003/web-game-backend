import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const assignNgWords = async (roomId, userIds) => {
  if (!userIds || userIds.length === 0) {
    throw new Error("ユーザー情報が指定されていません。");
  }

  const userCount = userIds.length;

  // 必要な数だけランダムにNGワードを取得（パラメータ化クエリを使用）
  // SQLインジェクションのリスクを回避するため、プレースホルダー（$1）を使用
  const randomNgWords = await prisma.$queryRawUnsafe(
    `SELECT * FROM "NgWord" ORDER BY RANDOM() LIMIT $1`,
    userCount
  );

  console.log(`部屋${roomId}のランダムに選ばれたNGワード:`, randomNgWords);

  if (!randomNgWords || randomNgWords.length < userCount) {
    throw new Error("NGワードの数がプレイヤー数より少ないです。");
  }

  // 各プレイヤーにNGワードを割り振る
  const assignments = userIds.map((userId, index) => ({
    userId,
    word: randomNgWords[index].word,
  }));

  return assignments;
};
