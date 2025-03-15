const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const { router: shogiRouter, initializeBoard } = require("./shogi");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // クライアントのURL
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

// ルーム作成エンドポイント
app.post("/api/create-room", function (req, res) {
  const { roomName, username, gameType } = req.body;
  const roomId = uuidv4().substring(0, 6);
  const userId = uuidv4().substring(0, 6);

  rooms[roomId] = {
    roomName,
    gameType,
    users: [{ id: userId, username }],
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

    // 将棋の場合、部屋のユーザー数を2人に制限
    if (room.gameType === "shogi" && room.users.length >= 2) {
      return res.status(403).json({ message: "部屋がいっぱいです" });
    }

    const userId = uuidv4().substring(0, 6);
    rooms[roomId].users.push({ id: userId, username });
    res.json({ roomId, userId });

    // 全クライアントにユーザーが参加したことを通知
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

      // 他のクライアントにユーザーが退出したことを通知
      io.to(roomId).emit("user-left", { userId, username: user.username });
      console.log(`${user.username}さんが部屋${roomId}から退出しました。`);
    }

    // 部屋が空の場合は削除
    if (room.users.length === 0) {
      delete rooms[roomId];
      io.to(roomId).emit("room-deleted"); // 部屋が削除されたことを通知
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

		// 先手後手をランダムで決定
		const [firstPlayer, secondPlayer] = room.users.sort(() => Math.random() - 0.5);
		room.firstPlayer = firstPlayer;
		room.secondPlayer = secondPlayer;
		room.currentPlayer = firstPlayer.id;

		// ✅ logs を初期化
		room.logs = [];

		io.to(roomId).emit("game-started", {
			board: room.board,
			firstPlayer,
			secondPlayer,
			logs: room.logs, // ✅ クライアントにも logs を送信
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

// Socket.ioのイベント処理
io.on("connection", (socket) => {
  console.log("✅ ユーザー接続:", { socketId: socket.id });

  socket.on("join-room", ({ roomId, userId, username }) => {
    socket.join(roomId);
    socket.roomId = roomId; // 🔹 クライアントに roomId を保存
    socket.userId = userId; // 🔹 クライアントに userId を保存
    console.log(`🔹 ${username} さんが部屋 ${roomId} に参加しました`);

    io.to(roomId).emit(
      "server-log",
      `${username} さんが部屋 ${roomId} に参加しました`
    );
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

    // 切断したユーザーを削除
    room.users = room.users.filter((user) => user.id !== userId);

    if (room.users.length === 0) {
      delete rooms[roomId];
      console.log(`🗑 部屋 ${roomId} を削除しました`);
      return;
    }

    const isFirstPlayer = room.firstPlayer && room.firstPlayer.id === userId;
    const isSecondPlayer = room.secondPlayer && room.secondPlayer.id === userId;
    let winner = null;

    if (isFirstPlayer) {
      winner = room.secondPlayer ? room.secondPlayer.id : null;
    } else if (isSecondPlayer) {
      winner = room.firstPlayer ? room.firstPlayer.id : null;
    }

    if (winner) {
      io.to(roomId).emit("game-over", {
        message: "相手が切断しました！",
        winner,
      });
      console.log(`🎉 勝者: ${winner}`);
    }
  });
});

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
