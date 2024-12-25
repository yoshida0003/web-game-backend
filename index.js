const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
  }
  res.json({ roomId, userId });
});

app.post('/api/join-room', function (req, res) {
  const { roomName, username } = req.body;
  const roomId = Object.keys(rooms).find(roomId => rooms[roomId].roomName === roomName);
  if (roomId) {
    const userId = uuidv4().substring(0, 6);
    rooms[roomId].users.push({ id: userId, username });
    res.json({ roomId, userId });
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
  socket.on('disconnect', () => {
    console.log('ユーザーが切断しました');
  });
});

server.listen(3001, () => {
  console.log('Server listening on port 3001');
});