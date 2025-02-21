const express = require("express");
const router = express.Router();

// ボードの初期化関数
let initializeBoard = () => {
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

  // 後手の香車を1一と9一に配置
  board[0][0] = "l";
  board[0][8] = "l";

  // ✅ 駒台を初期化
  board.firstCaptured = [];
  board.secondCaptured = [];

  return board;
};

// ボードの内容を確認
let board = initializeBoard();
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
  R: (fromX, fromY, toX, toY) => {
    if (fromX !== toX && fromY !== toY) return false; // ❌ 縦横以外の移動は禁止
    console.log("boardの中身");
    console.table(board); // ←ここを修正

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
  r: (fromX, fromY, toX, toY) => {
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
  B: (fromX, fromY, toX, toY) => {
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
  b: (fromX, fromY, toX, toY) => {
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
  L: (fromX, fromY, toX, toY) => {
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
  l: (fromX, fromY, toX, toY) => {
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

  // 成り飛車（竜王）の移動範囲
  PR: (fromX, fromY, toX, toY, board) => {
    // 🚀 飛車の縦横移動をそのまま許可
    if (pieceMovementRules["R"](fromX, fromY, toX, toY, board)) {
      return true;
    }

    // 🚀 斜め1マスの移動を許可
    if (Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1) {
      return true;
    }

  },

  // 成り飛車（後手）の移動範囲
  pr: (fromX, fromY, toX, toY, board) => {
    if (pieceMovementRules["r"](fromX, fromY, toX, toY, board)) {
      return true;
    }

    if (Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1) {
      return true;
    }
  },

  // 成馬の移動範囲
  PB: (fromX, fromY, toX, toY, board) => {
    // 🚀 角の斜め移動をそのまま許可
    if (pieceMovementRules["B"](fromX, fromY, toX, toY, board)) {
      return true;
    }

    // 🚀 縦横1マスの移動を許可
    if (
      (Math.abs(fromX - toX) === 1 && fromY === toY) || // 縦移動
      (Math.abs(fromY - toY) === 1 && fromX === toX)
    ) {
      // 横移動
      return true;
    }
  },

  // 成馬の移動範囲
  pb: (fromX, fromY, toX, toY, board) => {
    if (pieceMovementRules["b"](fromX, fromY, toX, toY, board)) {
      return true;
    }

    if (
      (Math.abs(fromX - toX) === 1 && fromY === toY) ||
      (Math.abs(fromY - toY) === 1 && fromX === toX)
    ) {
      return true;
    }
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
  PP: "成り歩",
  pp: "成り歩",
  PS: "成り銀",
  ps: "成り銀",
  PN: "成り桂",
  pn: "成り桂",
  PL: "成り香",
  pl: "成り香",
  PR: "成り飛車",
  pr: "成り飛車",
  PB: "成り角",
  pb: "成り角",
};

// と金、成銀、成桂、成香の移動範囲（金と同じ）
pieceMovementRules["PP"] = pieceMovementRules["G"];
pieceMovementRules["pp"] = pieceMovementRules["g"];
pieceMovementRules["PS"] = pieceMovementRules["S"];
pieceMovementRules["ps"] = pieceMovementRules["s"];
pieceMovementRules["PN"] = pieceMovementRules["N"];
pieceMovementRules["pn"] = pieceMovementRules["n"];
pieceMovementRules["PL"] = pieceMovementRules["L"];
pieceMovementRules["pl"] = pieceMovementRules["l"];

// 玉の位置を取得
const getKingPosition = (board, isFirstPlayer) => {
  const king = isFirstPlayer ? "K" : "k";
  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      if (board[x][y] === king) {
        console.log(`👑 王の位置: (${x}, ${y})`);
        return { x, y };
      }
    }
  }
  return null;
};

// 王手のチェック
const isSquareAttacked = (board, x, y, isFirstPlayer) => {
  const opponentPieces = isFirstPlayer
    ? ["p", "r", "b", "g", "s", "n", "l", "k", "pp", "pr", "pb", "ps", "pn", "pl"]
    : ["P", "R", "B", "G", "S", "N", "L", "K", "PP", "PR", "PB", "PS", "PN", "PL"];

  for (let fromX = 0; fromX < 9; fromX++) {
    for (let fromY = 0; fromY < 9; fromY++) {
      const piece = board[fromX][fromY];
      if (opponentPieces.includes(piece)) {
        const moveRule = pieceMovementRules[piece];

        if (moveRule && moveRule(fromX, fromY, x, y, !isFirstPlayer)) {
          console.log(`⚠️ 王手！${piece} (${fromX}, ${fromY}) → (${x}, ${y})`);
          return true;
        }
      }
    }
  }
  return false;
};


// 玉が詰みかのチェック
const isKingInCheckmate = (board, kingPosition, isFirstPlayer) => {
  if (!kingPosition) {
    console.log("🚨 王の位置が見つかりません");
    return false;
  }

  console.log(
    `🔍 詰みチェック: 王の位置 (${kingPosition.x}, ${kingPosition.y})`
  );

  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
  ];

  for (const direction of directions) {
    const newX = kingPosition.x + direction.x;
    const newY = kingPosition.y + direction.y;

    if (
      newX >= 0 &&
      newX < 9 &&
      newY >= 0 &&
      newY < 9 &&
      !board[newX][newY] &&
      !isSquareAttacked(board, newX, newY, isFirstPlayer)
    ) {
      console.log(`✅ 逃げ道あり: (${newX}, ${newY})`);
      return false;
    }
  }

  console.log("🚨 詰み！王が逃げられません");
  return true;
};

const isMoveLegal = (board, fromX, fromY, toX, toY, isFirstPlayer) => {
  const tempBoard = JSON.parse(JSON.stringify(board)); // 盤面をコピー（元の状態を保持）
  const piece = tempBoard[fromX][fromY];
  const targetPiece = tempBoard[toX][toY]; // 取る駒

  // ① 移動（駒を取る場合も考慮）
  tempBoard[fromX][fromY] = null;
  tempBoard[toX][toY] = piece; // 移動先に駒を置く（取った駒は消える）

  // ② 玉の位置を取得
  const kingPosition = getKingPosition(tempBoard, isFirstPlayer);

  // ③ 王手をかけている駒のリストを取得
  const attackingPieces = getAttackingPieces(
    tempBoard,
    kingPosition.x,
    kingPosition.y,
    isFirstPlayer
  );

  // ④ 王を狙っている駒を取れるかチェック
  const canCaptureAttacker = attackingPieces.some(
    (attacker) => attacker.x === toX && attacker.y === toY
  );

  if (canCaptureAttacker) {
    console.log(
      `✅ 駒取り成功！${piece} が (${toX}, ${toY}) の駒を取ることで王手解除`
    );
    return true; // 攻撃駒を取って王手解除できるなら合法手
  }

  // ⑤ 合駒チェック（王と攻撃駒の間に指す手）
  const isBlocked = attackingPieces.some((attacker) =>
    isPieceBlocking(
      kingPosition,
      { x: attacker.x, y: attacker.y },
      { x: toX, y: toY }
    )
  );

  if (isBlocked) {
    console.log(`✅ 合駒成功！駒 (${toX}, ${toY}) を置けば王手解除`);
    return true;
  }

  // ⑥ 王手が続いているなら「非合法手」
  if (
    isSquareAttacked(tempBoard, kingPosition.x, kingPosition.y, isFirstPlayer)
  ) {
    console.log(
      `🚨 非合法手！(${fromX}, ${fromY}) → (${toX}, ${toY}) は王手が続く`
    );
    return false;
  }

  console.log(`✅ 合法手: (${fromX}, ${fromY}) → (${toX}, ${toY})`);
  return true;
};

const getAttackingPieces = (board, kingX, kingY, isFirstPlayer) => {
  const attackingPieces = [];
  const opponentPieces = isFirstPlayer
    ? ["p", "r", "b", "g", "s", "n", "l", "k", "pp", "pr", "pb", "ps", "pn", "pl"]
    : ["P", "R", "B", "G", "S", "N", "L", "K", "PP", "PR", "PB", "PS", "PN", "PL"];

  for (let fromX = 0; fromX < 9; fromX++) {
    for (let fromY = 0; fromY < 9; fromY++) {
      const piece = board[fromX][fromY];
      if (opponentPieces.includes(piece)) {
        const moveRule = pieceMovementRules[piece];

        if (moveRule && moveRule(fromX, fromY, kingX, kingY, !isFirstPlayer)) {
          attackingPieces.push({ piece, x: fromX, y: fromY });
        }
      }
    }
  }
  return attackingPieces;
};


const canBlockCheck = (board, kingPos, blockPos, attackingPieces) => {
  for (const attacker of attackingPieces) {
    const { x: ax, y: ay, piece } = attacker;

    // 飛車・角・香車など、直線攻撃の駒がある場合
    if (["R", "r", "B", "b", "L", "l"].includes(piece)) {
      if (isPieceBlocking(board, kingPos, { x: ax, y: ay }, blockPos)) {
        console.log(
          `✅ 合駒成功: ${blockPos.x}, ${blockPos.y} に駒を置けば王手回避！`
        );
        return true;
      }
    }
  }
  return false;
};

const isPieceBlocking = (kingPos, attackerPos, blockPos) => {
  const dx = Math.sign(attackerPos.x - kingPos.x);
  const dy = Math.sign(attackerPos.y - kingPos.y);

  let x = kingPos.x + dx;
  let y = kingPos.y + dy;

  while (x !== attackerPos.x || y !== attackerPos.y) {
    if (x === blockPos.x && y === blockPos.y) {
      return true; // ブロック可能
    }
    x += dx;
    y += dy;
  }
  return false;
};


// 駒の移動 API (ドラッグ＆ドロップ用)
router.post("/move-piece", function (req, res) {
  try {
    const { roomId, userId, fromX, fromY, toX, toY, promote } = req.body;
    const rooms = req.app.get("rooms");
    const room = rooms[roomId];

    if (!room || !room.gameStarted) {
      return res.status(400).json({ message: "ゲームが開始されていません" });
    }

    if (room.currentPlayer !== userId) {
      return res.status(400).json({ message: "あなたのターンではありません" });
    }

    const isFirstPlayer = room.currentPlayer === room.firstPlayer.id;
    board = room.board;

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

    // 指した（打った）場所の駒を取得
    const targetPiece = room.board[actualToX][actualToY];

    // ✅ 駒台からの駒の場合
    if (fromX === 9) {
      console.log("🟢 先手の駒台から駒を取得");
      piece = board.firstCaptured[fromY]; // 駒台の駒を取得
      if (!targetPiece) {
        board.firstCaptured.splice(fromY, 1); // 取得した駒を削除
        room.capturedPieces.firstPlayer.splice(fromY, 1); // capturedPieces からも削除
      }
    } else if (fromX === 10) {
      console.log("🟢 後手の駒台から駒を取得");
      piece = board.secondCaptured[fromY]; // 駒台の駒を取得
      if (!targetPiece) {
        board.secondCaptured.splice(fromY, 1); // 取得した駒を削除
        room.capturedPieces.secondPlayer.splice(fromY, 1); // capturedPieces からも削除
      }
    }

    // ✅ 1. 自分の王の位置を取得
    const kingPosition = getKingPosition(room.board, isFirstPlayer);

    // ✅ 2. 現在王手を受けているかチェック
    const isKingInCheck =
      kingPosition &&
      isSquareAttacked(
        room.board,
        kingPosition.x,
        kingPosition.y,
        isFirstPlayer
      );

    if (isKingInCheck) {
      console.log(
        `🚨 現在 ${isFirstPlayer ? "先手" : "後手"} の王が王手を受けています！`
      );

      // ✅ 3. 王手をかけている駒のリストを取得
      const attackingPieces = getAttackingPieces(
        room.board,
        kingPosition.x,
        kingPosition.y,
        isFirstPlayer
      );

      console.log("⚠️ 王手をかけている駒:", attackingPieces);

      // ✅ 4. 指そうとしている手が王手を回避するかチェック
      const isLegalMove = isMoveLegal(
        room.board,
        actualFromX,
        actualFromY,
        actualToX,
        actualToY,
        isFirstPlayer
      );

      // ✅ 5. 合駒が有効かチェック（駒台から駒を打つ場合）
      const isValidBlock =
        fromX === 9 || fromX === 10
          ? canBlockCheck(
              room.board,
              kingPosition,
              { x: actualToX, y: actualToY },
              attackingPieces
            )
          : false;

      if (!isLegalMove && !isValidBlock) {
        console.log("⛔ 非合法手！王手が続くため、この手は指せません！");
        return res
          .status(400)
          .json({ message: "王手中は回避する手しか指せません！" });
      }

      console.log("✅ 合法手！王手を回避可能");
    }

    // ✅ 指した（打った）場所に駒がある場合はエラー（駒台からの場合のみ）
    if ((fromX === 9 || fromX === 10) && targetPiece) {
      return res.status(400).json({ message: "そこには打てません" });
    }

    // ✅ 1. 駒がない場合はエラー
    if (!piece) {
      return res.status(400).json({ message: "移動できる駒がありません" });
    }

    // ✅ 2. 同じ場所に移動しようとしたら何もしない
    if (actualFromX === actualToX && actualFromY === actualToY) {
      return res
        .status(400)
        .json({ message: "同じ場所に移動することはできません" });
    }

    // ✅ 3. 自分の駒かチェック
    let isOwnPiece =
      (isFirstPlayer && piece === piece.toUpperCase()) ||
      (!isFirstPlayer && piece === piece.toLowerCase());

    // ✅ 駒台から出す場合は必ず自分の駒と判定
    if (fromX === 9 || fromX === 10) {
      isOwnPiece = true;
    }

    console.log(isOwnPiece);

    if (!isOwnPiece) {
      return res.status(400).json({ message: "相手の駒は動かせません" });
    }

    // ✅ 4. **移動先に自分の駒があるかチェック**
    if (targetPiece) {
      const isOwnTargetPiece =
        (isFirstPlayer && targetPiece === targetPiece.toUpperCase()) ||
        (!isFirstPlayer && targetPiece === targetPiece.toLowerCase());

      if (isOwnTargetPiece) {
        return res
          .status(400)
          .json({ message: "自分の駒がある場所には指せません" });
      }
    }

    // ✅ 5. 移動ルールのチェック（駒台からの駒はスキップ）
    if (
      fromX !== 9 &&
      fromX !== 10 && // 駒台からの移動でなければチェックする
      (!pieceMovementRules[piece] ||
        !pieceMovementRules[piece](
          actualFromX,
          actualFromY,
          actualToX,
          actualToY,
          isFirstPlayer,
          room.board
        ))
    ) {
      console.log(room.board);
      return res.status(400).json({ message: "不正な移動です" });
    }

    if (targetPiece) {
      // 成った駒を元の駒に戻す
      const demotionMap = {
        PP: "P",
        pp: "p",
        PS: "S",
        ps: "s",
        PN: "N",
        pn: "n",
        PL: "L",
        pl: "l",
        PR: "R",
        pr: "r",
        PB: "B",
        pb: "b",
      };
      const capturedPiece = demotionMap[targetPiece] || targetPiece;
      const owner = isFirstPlayer ? "first" : "second"; // 修正: 取得した側の所有者を正しく設定

      if (isFirstPlayer) {
        room.capturedPieces.firstPlayer.push({
          piece: capturedPiece.toUpperCase(), // 取得した駒を大文字に変換
          owner,
        });
        board.firstCaptured.push(capturedPiece.toUpperCase()); // 先手の駒台に追加
      } else {
        room.capturedPieces.secondPlayer.push({
          piece: capturedPiece.toLowerCase(), // 取得した駒を小文字に変換
          owner,
        });
        board.secondCaptured.push(capturedPiece.toLowerCase()); // 後手の駒台に追加
      }
    }

    // ✅ 7. 成る処理
    if (promote) {
      const promotionMap = {
        P: "PP",
        p: "pp",
        S: "PS",
        s: "ps",
        N: "PN",
        n: "pn",
        L: "PL",
        l: "pl",
        R: "PR",
        r: "pr",
        B: "PB",
        b: "pb",
      };

      if (promotionMap[piece]) {
        piece = promotionMap[piece];
      }
    }

    // ✅ 駒を移動（駒台からの駒も含む）
    room.board[actualToX][actualToY] = piece;

    // ✅ `actualFromX` が存在する場合のみ `null` を代入
    if (room.board[actualFromX]) {
      room.board[actualFromX][actualFromY] = null;
    }

    console.log(
      `🚀 駒を移動: ${actualFromX},${actualFromY} → ${actualToX},${actualToY}, 成り=${promote}`
    );

    console.table(room.board);

    // 駒台の配列をログに表示
    console.log("先手の駒台:", room.capturedPieces.firstPlayer);
    console.log("後手の駒台:", room.capturedPieces.secondPlayer);

    // ✅ 9. ターン交代
    room.currentPlayer = isFirstPlayer
      ? room.secondPlayer.id
      : room.firstPlayer.id;

    // ✅ 10. ログ記録
    const rowLabels = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const colLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let displayToX = actualToX;
    let displayToY = 8 - actualToY;
    const pieceName = pieceNames[piece] || "駒";

    room.logs.push(
      `${isFirstPlayer ? "先手" : "後手"}: ${colLabels[displayToY]}${
        rowLabels[displayToX]
      }${pieceName}`
    );

    // ✅ 11. クライアントに更新を通知
    req.app.get("io").emit("update-board", {
      board: room.board,
      currentPlayer: room.currentPlayer,
      logs: room.logs,
      capturedPieces: room.capturedPieces,
    });

    // ✅ 12. 相手の玉が詰みかチェック
    const opponentKingPosition = getKingPosition(room.board, !isFirstPlayer);
    if (
      opponentKingPosition &&
      isSquareAttacked(
        room.board,
        opponentKingPosition.x,
        opponentKingPosition.y,
        !isFirstPlayer
      )
    ) {
      console.log(
        `⚠️ ${isFirstPlayer ? "後手" : "先手"}の王が王手を受けています！`
      );
      if (isKingInCheckmate(room.board, opponentKingPosition, !isFirstPlayer)) {
        const winner = isFirstPlayer
          ? room.firstPlayer.id
          : room.secondPlayer.id;
        req.app.get("io").emit("game-over", {
          message: "相手の玉が詰みました",
          winner,
        });
        delete rooms[roomId]; // 部屋を削除
      }
    }

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