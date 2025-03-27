import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import { router as shogiRouter, initializeBoard } from "./shogi.js";
import registerHandler from "./pages/api/register.js";
import loginHandler from "./pages/api/login.js";
import addNgWordHandler from "./pages/api/addNgWord.js"; 
import importNgWordsHandler from "./pages/api/importNgWords.js"; 
import verifyTokenHandler from "./pages/api/verifyToken.js";
import { assignNgWords } from "./pages/api/ngWord.js";
import dotenv from "dotenv";

// 環境変数の読み込み
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(express.json());
app.use(cors());
app.set("io", io);

const rooms = {};
app.set("rooms", rooms);

// ユーザー登録エンドポイント
app.post("/api/register", registerHandler);

// ログインエンドポイント
app.post("/api/login", loginHandler);

// NGワード追加エンドポイント
app.post("/api/addNgWord", addNgWordHandler); 

// NGワードインポートエンドポイント
app.post("/api/importNgWords", importNgWordsHandler); 

// JWT検証エンドポイント
app.post("/api/verify-token", verifyTokenHandler);

// ルーム作成エンドポイント
app.post("/api/create-room", function (req, res) {
  const { roomName, username, gameType } = req.body;
  const roomId = uuidv4().substring(0, 6);
  const userId = uuidv4().substring(0, 6);

  // ユーザーオブジェクトを作成
  const user = {
    id: userId,
    username,
    ...(gameType === "ng-word" && { points: 0 }), // gameTypeがng-wordの場合のみpointsを追加
  };

  // 部屋を作成
  rooms[roomId] = {
    roomName,
    gameType,
    users: [user],
    gameStarted: false,
  };

  res.json({ roomId, userId });
  io.to(roomId).emit("user-joined", { userId, username });
  console.log(`${username}さんが部屋${roomId}に入室しました。`);
});

// ルーム参加エンドポイント
app.post("/api/join-room", function (req, res) {
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
    res.json({ roomId, userId });

    io.to(roomId).emit("user-joined", { userId, username });
    console.log(`${username}さんが部屋${roomId}に入室しました。`);
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

// ルーム退出エンドポイント
app.post("/api/leave-room", function (req, res) {
  const { roomId, userId } = req.body;
  const room = rooms[roomId];

  if (room) {
    const userIndex = room.users.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      const user = room.users[userIndex];
      room.users.splice(userIndex, 1);

      io.to(roomId).emit("user-left", { userId, username: user.username });
      console.log(`${user.username}さんが部屋${roomId}から退出しました。`);
    }

    if (room.users.length === 0) {
      delete rooms[roomId];
      io.to(roomId).emit("room-deleted");
      console.log(`部屋${roomId}が削除されました`);
    }

    res.json({ message: "User left the room" });
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

// 部屋の情報取得エンドポイント
app.get("/api/room/:roomId", function (req, res) {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

// ゲーム開始のエンドポイント
app.post("/api/start-game", function (req, res) {
  const { roomId } = req.body;
  const room = rooms[roomId];

  if (room && room.users.length === 2) {
    room.gameStarted = true;
    room.board = initializeBoard();

    const [firstPlayer, secondPlayer] = room.users.sort(
      () => Math.random() - 0.5
    );
    room.firstPlayer = firstPlayer;
    room.secondPlayer = secondPlayer;
    room.currentPlayer = firstPlayer.id;

    room.logs = [];

    io.to(roomId).emit("game-started", {
      board: room.board,
      firstPlayer,
      secondPlayer,
      logs: room.logs,
    });

    console.log(
      `部屋${roomId}のゲームを開始しました! 先手: ${firstPlayer.username}, 後手: ${secondPlayer.username}`
    );
    res.json({ message: "Game started" });
  } else {
    res.status(400).json({ message: "ゲームが始められません" });
  }
});

app.use("/api/shogi", shogiRouter);

// NGワードのゲーム開始のエンドポイント
app.post("/api/start-ng-word-game", async function (req, res) {
  const { roomId } = req.body;
  const room = rooms[roomId];

  if (room && room.users.length >= 2) {
    room.gameStarted = true;

    // 部屋のユーザーIDをログに出力
    console.log(`部屋${roomId}のNGワードゲームを開始しました!`);
    console.log(
      `部屋のユーザーID: ${room.users.map((user) => user.id).join(", ")}`
    );

    try {
      // ユーザーIDを取得
      const userIds = room.users.map((user) => user.id);
      console.log(userIds);

      // NGワードを割り振る
      const assignments = await assignNgWords(roomId, userIds);
      console.log("割り振られたNGワード:", assignments);

      // 割り振られたNGワードを各ユーザーに保存
      room.users = room.users.map((user) => ({
        ...user,
        ngWord: assignments.find((assignment) => assignment.userId === user.id)
          ?.word,
      }));

      // クライアントに通知
      io.to(roomId).emit("ng-word-game-started", {
        message: "NGワードゲームが開始されました！",
        users: room.users,
        assignments,
      });

      // タイマーを開始
      let countdown = 60;
      const interval = setInterval(() =>{
        countdown -= 1;
        io.to(roomId).emit("timer-update", { countdown });

        if (countdown <= 0) {
          clearInterval(interval);
          io.to(roomId).emit("game-ended", { message: "ゲーム終了" });
          room.gameStarted = false;

          // 最終的なポイントを計算して勝者を決定
          const winner = room.users.reduce((prev, curr) => 
            prev.points < curr.points ? prev : curr
          );
          io.to(roomId).emit("game-result", {
            message: `${winner.username}の勝ちです！`,
            users: room.users,
          });
        }
      }, 1000);

      res.json({ message: "NGワードゲームが開始されました", assignments });
    } catch (error) {
      console.error(
        `部屋${roomId}のNGワード割り振り中にエラーが発生しました:`,
        error
      );
      res
        .status(500)
        .json({
          message: "NGワードの割り振り中にエラーが発生しました",
          error: error.message,
        });
    }
  } else {
    res.status(400).json({ message: "ゲームを開始するには2人以上が必要です" });
  }
});

app.post("/api/click-word", async function (req, res) {
  const { roomId, targetUserId } = req.body;
  const room = rooms[roomId];

  if (room) {
    const targetUser = room.users.find((user) => user.id === targetUserId);

    if (targetUser) {
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

      io.to(roomId).emit("word-clicked", {
        targetUserId,
        points: targetUser.points,
        newWord: targetUser.ngWord,
      });

      res.json({ message: "ポイントが更新されました", targetUser });
    } else {
      res.status(404).json({ message: "対象のユーザーが見つかりません" });
    }
  } else {
    res.status(404).json({ message: "部屋が見つかりません" });
  }
});

// Socket.ioのイベント処理
io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, userId, username }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;
    console.log(`🔹 ${username} さんが部屋 ${roomId} に参加しました`);

    io.to(roomId).emit("user-joined", { userId, username });
  });

  socket.on("disconnect", () => {
    console.log("🚨 ユーザーが切断しました:", socket.id);

    const roomId = socket.roomId;
    const userId = socket.userId;

    if (!roomId || !rooms[roomId]) {
      console.log("🚨 エラー: 部屋の情報が見つかりません");
      return;
    }

    const room = rooms[roomId];

    // 退出したユーザーを削除
    const user = room.users.find((user) => user.id === userId);
    room.users = room.users.filter((user) => user.id !== userId);

    // 他のクライアントに通知
    if (user) {
      io.to(roomId).emit("user-left", { userId, username: user.username });
      console.log(`${user.username} さんが部屋 ${roomId} から退出しました`);
    }

    // 部屋が空になった場合、削除
    if (room.users.length === 0) {
      delete rooms[roomId];
      console.log(`🗑 部屋 ${roomId} を削除しました`);
    }
  });
});

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
