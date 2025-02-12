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

  // 先手の玉を5九に配置
  board[8][4] = "K";
  // 後手の玉を5一に配置
  board[0][4] = "k";

  // 先手の飛車を2八に配置
  board[7][7] = "R";
  // 後手の飛車を8二に配置
  board[1][1] = "r";

  // 先手の角を8八に配置
  board[7][1] = "B";
  // 後手の角を2二に配置
  board[1][7] = "b";

  // 先手の金を4九と6九に配置
  board[8][3] = "G";
  board[8][5] = "G";

  // 後手の金を4一と6一に配置
  board[0][3] = "g";
  board[0][5] = "g";

  // 先手の銀を3九と7九に配置
  board[8][2] = "S";
  board[8][6] = "S";

  // 後手の銀を3一と7一に配置
  board[0][2] = "s";
  board[0][6] = "s";

	// 先手の桂馬を2九と8九に配置
	board[8][1] = "N";
	board[8][7] = "N";

	// 後手の桂馬を2一と8一に配置
	board[0][1] = "n";
	board[0][7] = "n";

	// 先手の香車を1九と9九に配置	
	board[8][0] = "L";
  board[8][8] = "L";

  // 後手の香��を1一と9一に配置
  board[0][0] = "l";
  board[0][8] = "l";

  return board;
};

// ボードの内容を確認
const board = initializeBoard();
console.log("🔍 初期化されたボード全体:");
console.table(board);

// ✅ 駒台（取られた駒を保存）
const initializeCapturedPieces = () => ({
	firstPlayer: [],
	secondPlayer: [],
});

// 駒の移動可能範囲
const pieceMovementRules = {
  // 先手の歩の移動範囲
  P: (fromX, fromY, toX, toY, isFirstPlayer) => {
    const expectedX = isFirstPlayer ? fromX - 1 : fromX + 1;
    return toX === expectedX && toY === fromY;
  },
  // 後手の歩の移動範囲
  p: (fromX, fromY, toX, toY, isFirstPlayer) => {
    const expectedX = isFirstPlayer ? fromX - 1 : fromX + 1;
    return toX === expectedX && toY === fromY;
  },
  // 先手の玉の移動範囲
  K: (fromX, fromY, toX, toY) => {
    return Math.abs(fromX - toX) <= 1 && Math.abs(fromY - toY) <= 1;
  },
  // 後手の玉の移動範囲
  k: (fromX, fromY, toX, toY) => {
    return Math.abs(fromX - toX) <= 1 && Math.abs(fromY - toY) <= 1;
  },
  // 先手の飛車の移動範囲
  R: (fromX, fromY, toX, toY, board) => {
    if (fromX !== toX && fromY !== toY) return false; // ❌ 縦横以外の移動は禁止

    const directionX = fromX === toX ? 0 : toX > fromX ? 1 : -1; // 左右移動
    const directionY = fromY === toY ? 0 : toY > fromY ? 1 : -1; // 上下移動

    for (
      let x = fromX + directionX, y = fromY + directionY;
      x !== toX || y !== toY;
      x += directionX, y += directionY
    ) {
      if (board[x]?.[y]) return false; // ❌ 途中に駒があれば移動不可
    }

    return true; // ✅ 途中に駒がなければ移動可能
  },
  // 後手の飛車の移動範囲
  r: (fromX, fromY, toX, toY, board) => {
    if (fromX !== toX && fromY !== toY) return false; // ❌ 縦横以外の移動は禁止

    const directionX = fromX === toX ? 0 : toX > fromX ? 1 : -1;
    const directionY = fromY === toY ? 0 : toY > fromY ? 1 : -1;

    for (
      let x = fromX + directionX, y = fromY + directionY;
      x !== toX || y !== toY;
      x += directionX, y += directionY
    ) {
      if (board[x]?.[y]) return false;
    }

    return true;
  },

  // 先手の角の移動範囲
  B: (fromX, fromY, toX, toY, board) => {
    if (Math.abs(fromX - toX) !== Math.abs(fromY - toY)) return false; // ❌ 斜め移動のみ可能

    const directionX = toX > fromX ? 1 : -1;
    const directionY = toY > fromY ? 1 : -1;

    for (
      let x = fromX + directionX, y = fromY + directionY;
      x !== toX;
      x += directionX, y += directionY
    ) {
      if (board[x]?.[y]) return false; // ❌ 途中に駒があれば移動不可
    }

    return true;
  },
  // 後手の角の移動範囲
  b: (fromX, fromY, toX, toY, board) => {
    if (Math.abs(fromX - toX) !== Math.abs(fromY - toY)) return false;

    const directionX = toX > fromX ? 1 : -1;
    const directionY = toY > fromY ? 1 : -1;

    for (
      let x = fromX + directionX, y = fromY + directionY;
      x !== toX;
      x += directionX, y += directionY
    ) {
      if (board[x]?.[y]) return false;
    }

    return true;
  },
  // 先手の金の移動範囲
  G: (fromX, fromY, toX, toY) => {
    const isVertical = Math.abs(fromX - toX) === 1 && fromY === toY; // 縦移動
    const isHorizontal = Math.abs(fromY - toY) === 1 && fromX === toX; // 横移動
    const isDiagonal =
      Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1; // 斜め移動
    const isValidDiagonal = isDiagonal && toX < fromX; // 右下と左下には行けない
    return isVertical || isHorizontal || isValidDiagonal;
  },
  // 後手の金の移動範囲
  g: (fromX, fromY, toX, toY) => {
    const isVertical = Math.abs(fromX - toX) === 1 && fromY === toY; // 縦移動
    const isHorizontal = Math.abs(fromY - toY) === 1 && fromX === toX; // 横移動
    const isDiagonal =
      Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1; // 斜め移動
    const isValidDiagonal = isDiagonal && fromX < toX; // 右下と左下には行けない （ただし先手基準とは逆になる）
    return isVertical || isHorizontal || isValidDiagonal;
  },
  // 先手の銀の移動範囲
  S: (fromX, fromY, toX, toY) => {
    const isVertical = Math.abs(fromX - toX) === 1 && fromY === toY; // 縦移動
    const isVaildVertical = isVertical && toX < fromX; // 下には行けない
    const isDiagonal =
      Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1;
    return isVaildVertical || isDiagonal;
  },
  // 後手の銀の移動範囲
  s: (fromX, fromY, toX, toY) => {
    const isVertical = Math.abs(fromX - toX) === 1 && fromY === toY; // 縦移動
    const isVaildVertical = isVertical && fromX < toX; // 下には行けない（ただし先手基準とは逆になる）
    const isDiagonal =
      Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1;
    return isVaildVertical || isDiagonal;
  },
  // 先手の桂馬の移動範囲
  N: (fromX, fromY, toX, toY) => {
    return (
      toX === fromX - 2 && (toY === fromY - 1 || toY === fromY + 1) // 先手基準のL字移動
    );
  },
  // 後手の桂馬の移動範囲
  n: (fromX, fromY, toX, toY) => {
    return (
      toX === fromX + 2 && (toY === fromY - 1 || toY === fromY + 1) // 後手基準のL字移動
    );
  },
  // 先手の香車の移動範囲
  L: (fromX, fromY, toX, toY, board) => {
    if (fromY < 0 || fromY > 8) return false; // ❌ Y座標の範囲外チェック
    if (fromX === toX || fromY !== toY) return false; // ❌ 縦移動のみ許可

    const direction = -1; // 先手の香車は上方向へ進む
    let maxReachableX = 0; // 盤の上端（0）まで移動可能

    for (let x = fromX + direction; x >= 0; x += direction) {
      if (!board[x]) break; // ❌ `board[x]` が範囲外ならループ終了
      const pieceAtX = board[x][fromY];

      if (pieceAtX) {
        // ❗ 最初にぶつかる駒を見つけた
        const isOwnPiece = pieceAtX.toUpperCase() === pieceAtX; // 大文字なら先手の駒
        maxReachableX = isOwnPiece ? x - direction : x; // 🏁 自分の駒なら1つ手前、相手の駒ならそこまで
        break;
      }
    }

    return toX === maxReachableX; // 🚀 目的地が許可された範囲内ならOK
  },

  // 後手の香車の移動範囲
  l: (fromX, fromY, toX, toY, board) => {
    if (fromY < 0 || fromY > 8) return false; // ❌ Y座標の範囲外チェック
    if (fromX === toX || fromY !== toY) return false; // ❌ 縦移動のみ許可

    const direction = 1; // 後手の香車は下方向へ進む
    let maxReachableX = 8; // 盤の下端（8）まで移動可能

    for (let x = fromX + direction; x <= 8; x += direction) {
      if (!board[x]) break; // ❌ `board[x]` が範囲外ならループ終了
      const pieceAtX = board[x][fromY];

      if (pieceAtX) {
        // ❗ 最初にぶつかる駒を見つけた
        const isOwnPiece = pieceAtX.toLowerCase() === pieceAtX; // 小文字なら後手の駒
        maxReachableX = isOwnPiece ? x - direction : x; // 🏁 自分の駒なら1つ手前、相手の駒ならそこまで
        break;
      }
    }

    return toX === maxReachableX; // 🚀 目的地が許可された範囲内ならOK
  },
};

const pieceNames = {
  P: "歩",
  p: "歩",
  K: "玉",
  k: "玉",
  R: "飛車",
  r: "飛車",
  B: "角",
  b: "角",
  G: "金",
  g: "金",
  S: "銀",
  s: "銀",
  N: "桂馬",
  n: "桂馬",
  L: "香車",
  l: "香車",
  RP: "成り歩",
  rp: "成り歩",
};

// 駒の成り歩の移動範囲（金と同じ）
pieceMovementRules["RP"] = pieceMovementRules["G"];
pieceMovementRules["rp"] = pieceMovementRules["g"];

// 駒の移動 API (ドラッグ＆ドロップ用)
router.post("/move-piece", function (req, res) {
  try {
    const { roomId, userId, fromX, fromY, toX, toY, promote } = req.body;
    const rooms = req.app.get("rooms");
    const room = rooms[roomId];

    if (!room || !room.gameStarted) {
      console.error("❌ ゲームが開始されていません");
      return res.status(400).json({ message: "ゲームが開始されていません" });
    }

    if (room.currentPlayer !== userId) {
      console.error("❌ ターンではないプレイヤーが駒を動かそうとしました");
      return res.status(400).json({ message: "あなたのターンではありません" });
    }

    const isFirstPlayer = room.currentPlayer === room.firstPlayer.id;

    // 駒台が未定義なら初期化
    if (!room.capturedPieces) {
      room.capturedPieces = initializeCapturedPieces();
    }

    // ✅ 座標を常にサーバー基準（先手基準）で処理
    const actualFromX = isFirstPlayer ? fromX : 8 - fromX;
    const actualFromY = isFirstPlayer ? fromY : 8 - fromY;
    const actualToX = isFirstPlayer ? toX : 8 - toX;
    const actualToY = isFirstPlayer ? toY : 8 - toY;
    let piece = room.board[actualFromX]?.[actualFromY];

    if (!piece) {
      console.error("❌ 移動元に駒がありません", { actualFromX, actualFromY });
      return res.status(400).json({ message: "移動できる駒がありません" });
    }

    // ✅駒の移動ルールを適用
    if (
      !pieceMovementRules[piece] ||
      !pieceMovementRules[piece](
        actualFromX,
        actualFromY,
        actualToX,
        actualToY,
        isFirstPlayer,
        room.board
      )
    ) {
      console.error("❌ 不正な移動です:", {
        actualFromX,
        actualFromY,
        actualToX,
        actualToY,
      });
      return res.status(400).json({ message: "不正な移動です" });
    }

    // ✅ 相手の駒を取ったら駒台に追加
    const targetPiece = room.board[actualToX][actualToY];

    if (targetPiece) {
      if (
        (isFirstPlayer && targetPiece === targetPiece.toLowerCase()) ||
        (!isFirstPlayer && targetPiece === targetPiece.toUpperCase())
      ) {
        const capturedPiece = targetPiece.toUpperCase(); // 取られた駒は大文字に統一（将来的な打ち直しのため）

        if (isFirstPlayer) {
          room.capturedPieces.firstPlayer.push(capturedPiece);
        } else {
          room.capturedPieces.secondPlayer.push(capturedPiece);
        }
      }
    }

		// ✅ 「成る」処理（既に成った駒は成れない）
		if (promote) {
			if (
				(piece === "P" && actualToX <= 2) ||
				(piece === "p" && actualToX >= 6)
			) {
				piece = piece === "P" ? "RP" : "rp"; // 成り歩に変換
				console.log(`✨ ${piece} に成りました！`);
			}
		}

		// ✅ 「成らない」を選択した場合も駒を移動
		room.board[actualToX][actualToY] = piece; // 駒を移動
		room.board[actualFromX][actualFromY] = null; // 元の位置を空にする

		console.log(`🚀 駒を移動: ${actualFromX},${actualFromY} → ${actualToX},${actualToY}, 成り=${promote}`);

		room.board[actualFromX][actualFromY] = null;

    // ✅ ターン交代
    room.currentPlayer = isFirstPlayer
      ? room.secondPlayer.id
      : room.firstPlayer.id;

    // ✅ `logs` を初期化
    if (!room.logs) {
      room.logs = [];
    }

    // ✅ ログの記録（後手視点の変換を追加）
    const rowLabels = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const colLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

    let displayToX = actualToX;
    let displayToY = 8 - actualToY;

    // ✅ 駒の種類をログに反映
    const pieceName = pieceNames[piece] || "駒";

    // ✅ 移動後のログを追加
    const moveLog = `${isFirstPlayer ? "先手" : "後手"}: ${
      colLabels[displayToY]
    }${rowLabels[displayToX]}${pieceName}`;
    room.logs.push(moveLog);

    // ✅ ターン交代のログを追加
    const turnLog = `ターン交代: 次のプレイヤー -> ${
      room.currentPlayer === room.firstPlayer.id ? "先手" : "後手"
    } (${room.currentPlayer})`;
    room.logs.push(turnLog);

    // ✅ 全クライアントにイベント送信
    req.app.get("io").emit("update-board", {
      board: room.board,
      currentPlayer: room.currentPlayer,
      logs: room.logs,
      capturedPieces: room.capturedPieces,
    });

    res.json({
      message: "駒を移動しました",
      board: room.board,
      logs: room.logs,
      currentPlayer: room.currentPlayer,
      capturedPieces: room.capturedPieces,
    });
  } catch (error) {
    console.error("❌ サーバーでエラー発生:", error);
    res.status(500).json({ message: "サーバー内部エラー" });
  }
});

module.exports = { router, initializeBoard };
