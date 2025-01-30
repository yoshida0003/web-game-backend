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

	// 後手の歩(相手の手前: 3段目)
	for (let i = 0; i < 9; i++) {
		board[2][i] = "p"; // 後手の歩
	}

	return board;
};

// 駒の移動 API (ドラッグ＆ドロップ用)
router.post("/move-piece", function (req, res) {
	try {
		const { roomId, userId, fromX, fromY, toX, toY, notation } = req.body;
		const rooms = req.app.get("rooms");
		const room = rooms[roomId];

		if (!room || !room.gameStarted) {
			console.error("部屋が存在しないか、ゲームが開始されていません");
			return res.status(400).json({ message: "ゲームが開始されていません" });
		}

		if (room.currentPlayer !== userId) {
			console.error("ターンではないプレイヤーが駒を動かそうとしました");
			return res.status(400).json({ message: "あなたのターンではありません" });
		}

		const isFirstPlayer = room.currentPlayer === room.firstPlayer.id;
		const piece = room.board[fromX]?.[fromY];

		if (!piece) {
			console.error("駒が存在しません:", { fromX, fromY });
			return res.status(400).json({ message: "移動できる駒がありません" });
		}

		if ((isFirstPlayer && piece !== "P") || (!isFirstPlayer && piece !== "p")) {
			console.error("移動できない駒を選択しました:", piece);
			return res.status(400).json({ message: "移動できる駒ではありません" });
		}

		if ((isFirstPlayer && toX < 0) || (!isFirstPlayer && toX > 8)) {
			console.error("移動不可: 盤外へ進もうとしました", { toX, toY });
			return res.status(400).json({ message: "これ以上前に進めません" });
		}

		const expectedX = isFirstPlayer ? fromX - 1 : fromX + 1;
		if (toX !== expectedX || toY !== fromY) {
			console.error("不正な移動です:", { fromX, fromY, toX, toY });
			return res.status(400).json({ message: "不正な移動です" });
		}

		// ✅ 駒を移動
		room.board[toX][toY] = piece;
		room.board[fromX][fromY] = null;

		// ✅ ターン交代
		room.currentPlayer = isFirstPlayer
			? room.secondPlayer.id
			: room.firstPlayer.id;

		console.log(`🛠 ターン交代: 次のプレイヤー -> ${room.currentPlayer}`);

		// ✅ `logs` を初期化
		if (!room.logs) {
			room.logs = [];
		}

		// ✅ ログに「4五歩」形式で記録
		const moveLog = `${isFirstPlayer ? "先手" : "後手"}: ${notation}歩`;
		room.logs.push(moveLog);

		// ✅ ターン交代のログを追加
		const turnLog = `ターン交代: 次のプレイヤー -> ${room.currentPlayer === room.firstPlayer.id ? "先手" : "後手"} (${room.currentPlayer})`;
		room.logs.push(turnLog);

		console.log("📢 update-board を送信: ", {
			roomId,
			board: room.board,
			currentPlayer: room.currentPlayer,
			logs: room.logs,
		});

		// ✅ 全クライアントにイベント送信
		req.app.get("io").emit("update-board", {
			board: room.board,
			currentPlayer: room.currentPlayer,
			logs: room.logs,
		});


		// ✅ ログにターン情報を明示的に出力
		console.log(`✅ ${moveLog}`);
		console.log(`🔄 ${turnLog}`);

		console.log(`✅ ${moveLog} - ${room.firstPlayer.id} vs ${room.secondPlayer.id}`);
		res.json({ message: "駒を移動しました", board: room.board, logs: room.logs, currentPlayer: room.currentPlayer });
	} catch (error) {
		console.error("サーバーでエラー発生:", error);
		res.status(500).json({ message: "サーバー内部エラー" });
	}
});

module.exports = { router, initializeBoard };