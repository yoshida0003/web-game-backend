import { v4 as uuidv4 } from "uuid";

export default function joinRoomHandler(req, res, rooms, io) {
  const { roomName, username, gameType } = req.body;

  const roomId = Object.keys(rooms).find(
    (roomId) =>
      rooms[roomId].roomName === roomName && rooms[roomId].gameType === gameType
  );

  if (roomId) {
    const room = rooms[roomId];

    if (room.gameType === "shogi" && room.users.length >= 2) {
      return res.status(403).json({ message: "部屋がいっぱいです" });
    }

    if (room.gameType === "ng-word" && room.users.length >= 6) {
      return res.status(403).json({ message: "NGワードの部屋がいっぱいです" });
    }

    let userId;
    do {
      userId = uuidv4().substring(0, 6); // 新しいuserIdを生成
    } while (room.users.some((user) => user.id === userId)); // 重複を防ぐ

    const user = {
      id: userId,
      username,
      ...(gameType === "ng-word" && { points: 0 }), // gameTypeがng-wordの場合のみpointsを追加
    };

    room.users.push(user);

    if (gameType === "ng-word") {
      const allReady = room.users
        .filter((u) => u.id !== room.users[0].id) // 部屋製作者以外
        .every((u) => u.isReady);

      io.to(roomId).emit("all-users-ready", { allReady }); // クライアントに通知
      console.log(`全員準備完了 (新しいユーザー参加後): ${allReady}`);
    }

    res.json({ roomId, userId });

    io.to(roomId).emit("user-joined", { userId, username });
    console.log(`${username}さんが部屋${roomId}に入室しました。`);
  } else {
    res.status(404).json({ message: "Room not found" });
  }
}
