import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import { router as shogiRouter, initializeBoard } from "./shogi.js";
import createRoomHandler from "./pages/api/createRoom.js";
import joinRoomHandler from "./pages/api/joinRoom.js";
import registerHandler from "./pages/api/register.js";
import loginHandler from "./pages/api/login.js";
import addNgWordHandler from "./pages/api/addNgWord.js"; 
import importNgWordsHandler from "./pages/api/importNgWords.js"; 
import verifyTokenHandler from "./pages/api/verifyToken.js";
import startNgWordGameHandler from "./pages/api/startNgWordGame.js";
import setTimerHandler from "./pages/api/setTimer.js";
import clickWordHandler from "./pages/api/clickWord.js";
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
app.post("/api/create-room", (req, res) => {
  createRoomHandler(req, res, rooms, io);
});

// ルーム参加エンドポイント
app.post("/api/join-room", (req, res) => {
  joinRoomHandler(req, res, rooms, io);
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

// 将棋のゲーム開始のエンドポイント
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
app.post("/api/start-ng-word-game", (req, res) => {
  startNgWordGameHandler(req, res, rooms, io);
});

// クリックワードエンドポイント
app.post("/api/click-word", (req, res) => {
  clickWordHandler(req, res, rooms, io);
});

app.post("/api/toggle-ready", function (req, res) {
  console.log("リクエスト受信: /api/toggle-ready", req.body);

  const { roomId, userId } = req.body;
  const room = rooms[roomId];

  if (room) {
    const user = room.users.find((user) => user.id === userId);

    if (user) {
      user.isReady = !user.isReady; // 準備状態を切り替える
      io.to(roomId).emit("user-ready-updated", {
        userId,
        isReady: user.isReady,
      });

      // 全員が準備完了しているか確認
      const allReady = room.users
        .filter((u) => u.id !== room.users[0].id) // 部屋製作者以外
        .every((u) => u.isReady);

      console.log(`全員準備完了: ${allReady}`); // デバッグログ
      io.to(roomId).emit("all-users-ready", { allReady });

      res.json({ message: "準備状態が更新されました", allReady });
    } else {
      console.log(`ユーザー${userId}が見つかりません`);
      res.status(404).json({ message: "ユーザーが見つかりません" });
    }
  } else {
    console.log(`部屋${roomId}が見つかりません`);
    res.status(404).json({ message: "部屋が見つかりません" });
  }
});

// タイマー設定エンドポイント
app.post("/api/set-timer", (req, res) => {
  setTimerHandler(req, res, rooms, io);
});

// Socket.ioのイベント処理
io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, userId, username }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;

    console.log(`🔹 ${username} さんが部屋 ${roomId} に参加しました`);

    // 部屋が存在しない場合は初期化
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        gameType: null, // ゲームタイプを初期化
        userSocketMap: {}, // ユーザー ID と Socket ID のマッピング
      };
    }

    const room = rooms[roomId];

    // ユーザーが既に部屋に存在するか確認
    const existingUser = room.users.find((user) => user.id === userId);
    if (!existingUser) {
      // ユーザーを部屋に追加
      room.users.push({ id: userId, username });
    } else {
      console.log(`🔹 ユーザー ${username} は既に部屋 ${roomId} に存在します`);
    }

    // ゲームタイプが ng-word の場合のみマッピングを更新
    if (room.gameType === "ng-word") {
      if (!room.userSocketMap) {
        room.userSocketMap = {}; // userSocketMap を初期化
      }
      room.userSocketMap[userId] = socket.id;
      console.log(`🔹 User ${userId} is mapped to Socket ID: ${socket.id}`);
    }

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
      if (room.gameType === "ng-word" && room.timer) {
        clearInterval(room.timer); // タイマーを停止
      }
      delete rooms[roomId];
      console.log(`🗑 部屋 ${roomId} を削除しました`);
    }
  });
});

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
