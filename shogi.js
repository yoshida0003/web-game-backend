const express = require("express");
const router = express.Router();

// ボードの初期化関数
const initializeBoard = () => {
  const board = Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));

  // 先手の歩(自分の手前: 6段目)
  for (let i = 0; i < 9; i++) {
    board[6][i] = "P"; // 先手の歩
  }

  for (let i = 0; i < 9; i++) {
    board[2][i] = "p"; // 後手の歩
  }

  return board;
};

//
router.post("/click-cell", function (req, res) {
  const { roomId, userId, x, y } = req.body;
  const rooms = req.app.get("rooms");
  const room = rooms[roomId];

  if (room && room.gameStarted) {
    if (room.currentPlayer !== userId) {
      return res.status(400).json({ message: "あなたのターンではありません" });
    }

    const isFirstPlayer = room.currentPlayer === room.firstPlayer.id;
    let position;

    // 先手と後手で座標を変換
    if (isFirstPlayer) {
      // 先手の視点: 左上が9一
      position = `${9 - y}${
        ["一", "二", "三", "四", "五", "六", "七", "八", "九"][x]
      }`;
    } else {
      // 後手の視点: 左上が1九
      position = `${y + 1}${
        ["九", "八", "七", "六", "五", "四", "三", "二", "一"][x]
      }`;
    }

    const playerRole = isFirstPlayer ? "先手" : "後手";
    const currentUser = room.users.find((user) => user.id === userId);

    // エラーチェック: currentUserが見つからない場合
    if (!currentUser) {
      console.error("クリックしたユーザーが見つかりません:", userId);
      return res.status(400).json({ message: "無効なユーザーIDです" });
    }

    // cell-clickedイベントをクライアントに送信
    req.app.get("io").to(roomId).emit("cell-clicked", {
      x,
      y,
      userId,
      username: currentUser.username,
      position,
      playerRole,
    });

    console.log(
      `ユーザー${currentUser.username} (${playerRole}) が (${x}, ${y}) -> ${position} をクリックしました`
    );

    // ターンを切り替え
    room.currentPlayer =
      room.currentPlayer === room.firstPlayer.id
        ? room.secondPlayer.id
        : room.firstPlayer.id;

    res.json({ message: "Cell clicked" });
  } else {
    console.error(
      "クリック処理エラー: 部屋が存在しないか、ゲームが開始されていません"
    );
    res.status(400).json({ message: "クリック処理が行われませんでした。" });
  }
});

module.exports = { router, initializeBoard };
