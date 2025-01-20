const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // クライアントのURLを指定
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

const rooms = {};

// ルーム作成エンドポイント
app.post("/api/create-room", function (req, res) {
  const { roomName, username, gameType } = req.body; // gameTypeでゲームの種類を受け取る
  const roomId = uuidv4().substring(0, 6);
  const userId = uuidv4().substring(0, 6);
  rooms[roomId] = {
    roomName,
		gameType,
    users: [{ id: userId, username }],
  };
  res.json({ roomId, userId });
  io.to(roomId).emit("user-joined", { userId, username });
  console.log(`${username}さんが部屋${roomId}に入室しました。`);
});

// ルーム参加エンドポイント
app.post("/api/join-room", function (req, res) {
  const { roomName, username, gameType } = req.body;
  const roomId = Object.keys(rooms).find(
		(roomId) => rooms[roomId].roomName === roomName && rooms[roomId].gameType === gameType //  gameTypeでフィルタリング
  );
  if (roomId) {
    const userId = uuidv4().substring(0, 6);
    rooms[roomId].users.push({ id: userId, username });
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
    const user = room.users.find((user) => user.id === userId);
    room.users = room.users.filter((user) => user.id !== userId);

    // 部屋が空の場合の処理
    if (room.users.length === 0) {
      delete rooms[roomId];
    }

    res.json({ message: "User left the room" });

    // このイベントが部屋の全ユーザーに通知される
    io.to(roomId).emit("user-left", { userId });
    console.log(`${user.username}さんが部屋${roomId}から退出しました。`);
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});


app.get("/api/room/:roomId", function (req, res) {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

io.on("connection", (socket) => {
  console.log("ユーザーが接続しました");

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("user-left", ({ userId }) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    console.log(`ユーザーID: ${userId}さんが退出しました。`);
  });

  socket.on("disconnect", () => {
    console.log("ユーザーが切断しました");
  });
});

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
