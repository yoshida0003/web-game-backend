import { v4 as uuidv4 } from "uuid";

export default function createRoomHandler(req, res, rooms, io) {
  const { roomName, username, gameType } = req.body;
  const roomId = uuidv4().substring(0, 6);
  const userId = uuidv4().substring(0, 6);

  // ユーザーオブジェクトを作成
  const user = {
    id: userId,
    username,
    ...(gameType === "ng-word" && { isReady: false }),
    ...(gameType === "ng-word" && { points: 0 }), // gameTypeがng-wordの場合のみpointsを追加
  };

  // 部屋を作成
  rooms[roomId] = {
    roomName,
    gameType,
    users: [user],
    gameStarted: false,
    ...(gameType === "ng-word" && { timerDuration: 300 }),
  };

  res.json({ roomId, userId });
  io.to(roomId).emit("user-joined", { userId, username });
  console.log(`${username}さんが部屋${roomId}に入室しました。`);
}
