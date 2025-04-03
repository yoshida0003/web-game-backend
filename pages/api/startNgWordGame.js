import { assignNgWords } from "./ngWord.js";
import endGameHandler from "./endGame.js";

export default async function startNgWordGameHandler(req, res, rooms, io) {
  const { roomId } = req.body;
  const room = rooms[roomId];

  if (room && room.users.length >= 2) {
    room.gameStarted = true;

    console.log(`部屋${roomId}のNGワードゲームを開始しました!`);
    console.log(
      `部屋のユーザーID: ${room.users.map((user) => user.id).join(", ")}`
    );

    try {
      const userIds = room.users.map((user) => user.id);
      console.log(userIds);

      const assignments = await assignNgWords(roomId, userIds);
      console.log("割り振られたNGワード:", assignments);

      room.users = room.users.map((user) => ({
        ...user,
        ngWord: assignments.find((assignment) => assignment.userId === user.id)
          ?.word,
      }));

      io.to(roomId).emit("ng-word-game-started", {
        message: "NGワードゲームが開始されました！",
        users: room.users,
        assignments,
      });

      let countdown = room.timerDuration || 300;
      const interval = setInterval(() => {
        countdown -= 1;

        if (!rooms[roomId]) {
          clearInterval(room.timer);
          return;
        }

        io.to(roomId).emit("timer-update", { countdown });

        if (countdown <= 0) {
          clearInterval(interval);
          endGameHandler(roomId, rooms, io); // ゲーム終了処理を呼び出し
        }
      }, 1000);

      res.json({ message: "NGワードゲームが開始されました", assignments });
    } catch (error) {
      console.error(
        `部屋${roomId}のNGワード割り振り中にエラーが発生しました:`,
        error
      );
      res.status(500).json({
        message: "NGワードの割り振り中にエラーが発生しました",
        error: error.message,
      });
    }
  } else {
    res.status(400).json({ message: "ゲームを開始するには2人以上が必要です" });
  }
}
