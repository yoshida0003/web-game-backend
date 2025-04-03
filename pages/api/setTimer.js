export default function setTimerHandler(req, res, rooms, io) {
  const { roomId, userId, timerDuration } = req.body;
  const room = rooms[roomId];

  if (room) {
    // ルーム製作者か部屋の一番最初のユーザーのみがタイマーを設定できる
    if (room.users[0].id !== userId) {
      return res.status(403).json({ message: "権限がありません" });
    }

    room.timerDuration = timerDuration;
    io.to(roomId).emit("timer-updated", { timerDuration });
    console.log(`部屋${roomId}のタイマーが${timerDuration}秒に設定されました`);
    res.json({ message: "タイマーが更新されました" });
  } else {
    res.status(404).json({ message: "部屋が見つかりません" });
  }
}
