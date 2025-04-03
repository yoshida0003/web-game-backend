import { assignNgWords } from "./ngWord.js";

export default async function clickWordHandler(req, res, rooms, io) {
  const { roomId, targetUserId } = req.body;
  const room = rooms[roomId];

  if (room) {
    const targetUser = room.users.find((user) => user.id === targetUserId);

    if (targetUser) {
      // 古いNGワードを保存
      const oldWord = targetUser.ngWord || "未設定";
      console.log(`🔹 クリック前のNGワード (oldWord): ${oldWord}`);

      // ポイントを+1（未定義の場合は0からスタート）
      targetUser.points = (targetUser.points || 0) + 1;

      // 新しいNGワードを割り当てる
      const newWord = await assignNgWords(roomId, [targetUserId]);
      targetUser.ngWord = newWord[0]?.word || "未設定";

      // ログにクリックされたユーザーIDと全員のポイントを出力
      console.log(`🔹 ${targetUserId} がクリックされました。`);
      console.log("🔹 現在のポイント:");
      room.users.forEach((user) => {
        console.log(
          `  - ${user.username} (ID: ${user.id}): ${user.points}ポイント`
        );
      });

      // ユーザー ID から Socket ID を取得
      const socketId = room.userSocketMap[targetUserId];
      if (socketId) {
        // クリックされたユーザーに通知を送信（古いワードを送信）
        console.log(`🔹 ${targetUserId} の Socket ID: ${socketId}`);

        console.log(`🔹 word-revealed-to-self イベントを送信: ${oldWord}`);
        io.to(socketId).emit("word-revealed-to-self", {
          word: oldWord, // 古いワードを送信
        });
        io.to(socketId).emit("word-revealed", {
          message: `あなたは "${oldWord}" をクリックされました。`, // 古いワードを通知
          points: targetUser.points,
        });
      } else {
        console.log(`🔹 Socket ID for user ${targetUserId} not found.`);
      }

      // 他のユーザーに新しいワードを送信
      room.users
        .filter((user) => user.id !== targetUserId) // クリックされたユーザー以外
        .forEach((user) => {
          const otherSocketId = room.userSocketMap[user.id];
          if (otherSocketId) {
            io.to(otherSocketId).emit("word-clicked", {
              targetUserId,
              points: targetUser.points,
              newWord: targetUser.ngWord, // 新しいワードを送信
            });
          }
        });

      res.json({ message: "ポイントが更新されました", targetUser });
    } else {
      res.status(404).json({ message: "対象のユーザーが見つかりません" });
    }
  } else {
    res.status(404).json({ message: "部屋が見つかりません" });
  }
}
