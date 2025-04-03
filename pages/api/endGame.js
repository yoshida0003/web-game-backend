export default function endGameHandler(roomId, rooms, io) {
  const room = rooms[roomId];

  if (room) {
    room.gameStarted = false;

    console.log(`部屋${roomId}の全ユーザーのポイント:`);
    room.users.forEach((user) => {
      console.log(
        `  - ${user.username} (ID: ${user.id}): ${user.points}ポイント`
      );
    });

    // 最小ポイントを取得
    const minPoints = Math.min(...room.users.map((user) => user.points));

    // 最小ポイントを持つユーザーをリストアップ
    const winners = room.users.filter((user) => user.points === minPoints);

    // 全ユーザーの準備状態をリセット
    room.users = room.users.map((user) => ({
      ...user,
      isReady: false,
      points: 0, // ポイントをリセット
    }));

    console.log("ゲーム終了時のユーザーリスト:", room.users);

    // クライアントに準備状態のリセットを通知
    io.to(roomId).emit("user-ready-updated", {
      users: room.users.map((user) => ({
        userId: user.id,
        isReady: user.isReady,
      })),
    });

    // ゲーム終了を通知
    io.to(roomId).emit("game-ended", {
      message: "ゲームが終了しました。",
    });

    // 勝者または引き分けの結果をクライアントに通知
    if (winners.length === 1) {
      // 勝者が1人の場合
      io.to(roomId).emit("game-result", {
        message: `${winners[0].username}の勝ちです！`,
        users: room.users,
      });
    } else {
      // 引き分けの場合
      const winnerNames = winners.map((user) => user.username).join(", ");
      io.to(roomId).emit("game-result", {
        message: `引き分けです！勝者: ${winnerNames}`,
        users: room.users,
      });
    }
  }
}
