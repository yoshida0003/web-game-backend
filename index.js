const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://lolhost:3000", // クライアントのURLを指定
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());

const rooms = {};

app.post('/api/create-room', function (req, res) {
  const { roomName, username } = req.body;
  const roomId = uuidv4().substring(0, 6);
  const userId = uuidv4().substring(0, 6);
  rooms[roomId] = {
    roomName,
    users: [{ id: userId, username }]
  };
  res.json({ roomId, userId });
  io.to(roomId).emit('user-joined', { userId, username });
});

app.post('/api/join-room', function (req, res) {
  const { roomName, username } = req.body;
  const roomId = Object.keys(rooms).find(roomId => rooms[roomId].roomName === roomName);
  if (roomId) {
    const userId = uuidv4().substring(0, 6);
    rooms[roomId].users.push({ id: userId, username });
    res.json({ roomId, userId });
    io.to(roomId).emit('user-joined', { userId, username });
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

app.post('/api/leave-room', function (req, res) {
  const { roomId, userId } = req.body;
  const room = rooms[roomId];
  if (room) {
    room.users = room.users.filter(user => user.id !== userId);
    if (room.users.length === 0) {
      delete rooms[roomId];
    }
    res.json({ message: 'User left the room' });
    io.to(roomId).emit('user-left', { userId });
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

app.get('/api/room/:roomId', function (req, res) {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました');

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log('ユーザーが切断しました');
  });
});

server.listen(3001, () => {
  console.log('Server listening on port 3001');
});