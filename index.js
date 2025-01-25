const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://game.yospace.org", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 20000, // タイムアウトを30秒に延長
  pingInterval: 1000, // 25秒ごとにpingを送信
});

app.use(express.json());
app.use(cors());

const rooms = {};

// ルーム作成エンドポイント
app.post("/api/create-room", function (req, res) {
	const { roomName, username, gameType } = req.body;
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
		(roomId) => rooms[roomId].roomName === roomName && rooms[roomId].gameType === gameType
	);

	if (roomId) {
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

// Socket.ioのイベント処理
io.on("connection", (socket) => {
	console.log("ユーザーが接続しました");
	socket.emit("server-log", "ユーザーが接続しました");

	socket.on("join-room", ({ roomId, userId, username }) => {
		socket.join(roomId);
		console.log(`${username}さんが部屋${roomId}に参加しました`);
		io.to(roomId).emit("server-log", `${username}さんが部屋${roomId}に参加しました`);
	});

	socket.on("leave-room", ({ roomId, userId, username }) => {
		socket.leave(roomId);
		console.log(`ユーザーID: ${userId}が部屋${roomId}から退出しました`);
		io.to(roomId).emit("server-log", `ユーザーID: ${userId}が部屋${roomId}から退出しました`);
	});

	socket.on("disconnect", () => {
		console.log("ユーザーが切断しました");
		socket.emit("server-log", "ユーザーが切断しました");
	});
});

server.listen(3001, () => {
	console.log("Server listening on port 3001");
});