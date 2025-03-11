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
  R: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
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
  r: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
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

  B: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    if (Math.abs(fromX - toX) !== Math.abs(fromY - toY)) return false; // ❌ 斜め移動のみ可能

    const directionX = toX > fromX ? 1 : -1;
    const directionY = toY > fromY ? 1 : -1;

    let x = fromX + directionX;
    let y = fromY + directionY;

    while (x !== toX && y !== toY) {
      if (x < 0 || x >= 9 || y < 0 || y >= 9) {
        console.log("🚨 範囲外エラー", x, y);
        return false; // ❌ 盤外チェック
      }

      if (!board || !board[x] || board[x][y] === undefined) {
        return false;
      }

      // **途中の駒チェック**
      if (board[x][y] !== null) {
        return false;
      }

      x += directionX;
      y += directionY;
    }

    // **目的地の駒チェック**
    if (!board || !board[toX] || board[toX][toY] === undefined) {
      return false;
    }

    console.log("✅ 角の移動可能", fromX, fromY, "→", toX, toY);
    return true;
  },

  // 後手の角の移動範囲
  b: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    if (Math.abs(fromX - toX) !== Math.abs(fromY - toY)) return false; // ❌ 斜め移動のみ可能

    const directionX = toX > fromX ? 1 : -1;
    const directionY = toY > fromY ? 1 : -1;

    let x = fromX + directionX;
    let y = fromY + directionY;

    while (x !== toX && y !== toY) {
      if (x < 0 || x >= 9 || y < 0 || y >= 9) {
        console.log("🚨 範囲外エラー", x, y);
        return false; // ❌ 盤外チェック
      }

      if (!board || !board[x] || board[x][y] === undefined) {
        return false;
      }

      // **途中の駒チェック**
      if (board[x][y] !== null) {
        return false;
      }

      x += directionX;
      y += directionY;
    }

    // **目的地の駒チェック**
    if (!board || !board[toX] || board[toX][toY] === undefined) {
      return false;
    }

    console.log("✅ 角の移動可能", fromX, fromY, "→", toX, toY);
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
  L: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    if (fromY < 0 || fromY > 8) return false; // ❌ Y座標の範囲外チェック
    if (fromY !== toY) return false; // ❌ 縦移動のみ許可

    const direction = -1; // 先手の香車は上方向へ進む
    let x = fromX + direction;

    while (x !== toX) {
      // **範囲外チェック**
      if (x < 0 || x >= 9) {
        console.log("🚨 範囲外エラー", x, fromY);
        return false; // ❌ 盤外チェック
      }


      // **途中の駒チェック**
      if (board[x]?.[fromY]) {
        return x === toX; // ✅ 目的地ならOK
      }

      x += direction;
    }

    console.log("✅ 香車の移動可能", fromX, fromY, "→", toX, toY);
    return true;
  },

  // 後手の香車の移動範囲
  l: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    if (fromY < 0 || fromY > 8) return false; // ❌ Y座標の範囲外チェック
    if (fromY !== toY) return false; // ❌ 縦移動のみ許可

    const direction = 1; // 後手の香車は下方向へ進む
    let x = fromX + direction;

    while (x !== toX) {
      // **範囲外チェック**
      if (x < 0 || x >= 9) {
        return false; // ❌ 盤外チェック
      }

      console.log("✅ x の値を確認", x, fromY);

      // **途中の駒チェック**
      if (board[x]?.[fromY]) {
        return x === toX; // ✅ 目的地ならOK
      }

      x += direction;
    }

    console.log("✅ 香車の移動可能", fromX, fromY, "→", toX, toY);
    return true;
  },

  // 成り飛車（竜王）の移動範囲
  PR: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    // 🚀 飛車の縦横移動をそのまま許可
    if (pieceMovementRules["R"](fromX, fromY, toX, toY, isFirstPlayer, board)) {
      return true;
    }

    // 🚀 斜め1マスの移動を許可
    if (Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1) {
      return true;
    }
  },

  // 成り飛車（後手）の移動範囲
  pr: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    if (pieceMovementRules["r"](fromX, fromY, toX, toY, isFirstPlayer, board)) {
      return true;
    }

    if (Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1) {
      return true;
    }
  },

  // 成馬の移動範囲
  PB: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    // 🚀 角の斜め移動をそのまま許可
    if (pieceMovementRules["B"](fromX, fromY, toX, toY, isFirstPlayer, board)) {
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
  pb: (fromX, fromY, toX, toY, isFirstPlayer, board) => {
    if (pieceMovementRules["b"](fromX, fromY, toX, toY, isFirstPlayer, board)) {
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
pieceMovementRules["PS"] = pieceMovementRules["G"];
pieceMovementRules["ps"] = pieceMovementRules["g"];
pieceMovementRules["PN"] = pieceMovementRules["G"];
pieceMovementRules["pn"] = pieceMovementRules["g"];
pieceMovementRules["PL"] = pieceMovementRules["G"];
pieceMovementRules["pl"] = pieceMovementRules["g"];

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
    ? [
        "p",
        "r",
        "b",
        "g",
        "s",
        "n",
        "l",
        "k",
        "pp",
        "pr",
        "pb",
        "ps",
        "pn",
        "pl",
      ]
    : [
        "P",
        "R",
        "B",
        "G",
        "S",
        "N",
        "L",
        "K",
        "PP",
        "PR",
        "PB",
        "PS",
        "PN",
        "PL",
      ];

  for (let fromX = 0; fromX < 9; fromX++) {
    for (let fromY = 0; fromY < 9; fromY++) {
      const piece = board[fromX][fromY];
      if (opponentPieces.includes(piece)) {
        const moveRule = pieceMovementRules[piece];

        if (moveRule && moveRule(fromX, fromY, x, y, !isFirstPlayer, board)) {
          console.log(`⚠️ 王手！${piece} (${fromX}, ${fromY}) → (${x}, ${y})`);
          return true;
        }
      }
    }
  }
  return false;
};

const isOwnPiece = (piece, isFirstPlayer) => {
  return isFirstPlayer
    ? piece === piece.toUpperCase()
    : piece === piece.toLowerCase();
};

// 玉が詰みかのチェック（王の移動 + 王手回避の駒移動 + 駒打ちでの王手回避）
const isKingInCheckmate = (
  board,
  kingPosition,
  isFirstPlayer,
  capturedPieces
) => {
  if (!kingPosition) {
    console.log("🚨 王の位置が見つかりません");
    return false;
  }

  console.log(
    `🔍 詰みチェック: 王の位置 (${kingPosition.x}, ${kingPosition.y})`
  );

  // **1️⃣ 王手がかかっているかチェック**
  const isCheck = isSquareAttacked(
    board,
    kingPosition.x,
    kingPosition.y,
    !isFirstPlayer
  );
  if (!isCheck) {
    console.log("✅ 王手ではない → 詰みではない");
    return false; // 王手でないなら詰みではない
  }

  // **2️⃣ 王の移動で回避できるかチェック**
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
      isKingMoveLegal(
        board,
        kingPosition.x,
        kingPosition.y,
        newX,
        newY,
        isFirstPlayer
      )
    ) {
      console.log(`✅ 逃げ道あり: (${newX}, ${newY})`);
      return false; // 王が移動できるなら詰みではない
    }
  }

  // **3️⃣ 王手をかけている駒を取得**
  const attackingPieces = getAttackingPieces(
    board,
    kingPosition.x,
    kingPosition.y,
    !isFirstPlayer
  ).filter((piece) => piece.piece !== (isFirstPlayer ? "K" : "k")); // 自分の玉を除外
  console.log("⚠️ 王手をかけている駒:", attackingPieces);

  // **4️⃣ 王が攻撃駒を取ることができるかチェック（取った後に王手が続くか確認）**
  for (const attacker of attackingPieces) {
    if (
      isKingMoveLegal(
        board,
        kingPosition.x,
        kingPosition.y,
        attacker.x,
        attacker.y,
        isFirstPlayer
      )
    ) {
      // **王を仮に移動させて攻撃駒を取る**
      const tempBoard = JSON.parse(JSON.stringify(board));
      tempBoard[kingPosition.x][kingPosition.y] = null;
      tempBoard[attacker.x][attacker.y] = isFirstPlayer ? "K" : "k";

      // **移動後の盤面をログに出力**
      console.log("🔍 王が攻撃駒を取った後の盤面:");
      console.table(tempBoard);

      // **移動後に王が新たに王手を受けるかチェック**
      if (!isSquareAttacked(tempBoard, attacker.x, attacker.y, isFirstPlayer)) {
        console.log(
          `✅ 王が直接 (${attacker.x}, ${attacker.y}) を取って王手回避可能！`
        );
        return false;
      }
    }
  }

  // **5️⃣ 攻撃駒を他の駒で取れるかチェック**
  for (const attacker of attackingPieces) {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        const piece = board[x][y];

        if (piece && isOwnPiece(piece, isFirstPlayer)) {
          if (
            pieceMovementRules[piece] &&
            pieceMovementRules[piece](
              x,
              y,
              attacker.x,
              attacker.y,
              isFirstPlayer,
              board
            )
          ) {
            console.log(
              `✅ ${piece} (${x}, ${y}) → (${attacker.x}, ${attacker.y}) で王手回避可能！`
            );
            return false;
          }
        }
      }
    }
  }

  // **6️⃣ 合駒（駒を打つ or 動かす）で王手回避可能かチェック**
  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      if (!board[x][y]) {
        if (canBlockCheck(board, kingPosition, { x, y }, attackingPieces)) {
          console.log(`✅ (${x}, ${y}) に駒を置けば王手回避可能！`);
          return false;
        }
      }
    }
  }

  // **7️⃣ 駒台から駒を打って王手回避できるかチェック**
  if (
    canBlockCheckWithDrop(
      board,
      kingPosition,
      attackingPieces,
      capturedPieces,
      isFirstPlayer
    )
  ) {
    console.log(`✅ 駒台から駒を打つことで王手回避可能！`);
    return false;
  }

  console.log("🚨 詰み！王が逃げられません");
  return true;
};

// **🔹 駒台から駒を打って王手を防げるかチェック**
const canBlockCheckWithDrop = (
  board,
  kingPos,
  attackingPieces,
  capturedPieces,
  isFirstPlayer
) => {
  const availableDrops = isFirstPlayer
    ? capturedPieces.firstPlayer
    : capturedPieces.secondPlayer;

  for (const attacker of attackingPieces) {
    if (["R", "r", "B", "b", "L", "l"].includes(attacker.piece)) {
      for (const piece of availableDrops) {
        for (let x = 0; x < 9; x++) {
          for (let y = 0; y < 9; y++) {
            if (!board[x][y]) {
              if (
                isPieceBlocking(
                  kingPos,
                  { x: attacker.x, y: attacker.y },
                  { x, y }
                )
              ) {
                console.log(
                  `✅ 駒台の ${piece.piece} を (${x}, ${y}) に打てば王手回避！`
                );
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
};

// **🔹 駒を動かして王手を防げるかチェック**
const isMoveLegal = (capBoard, isFirstPlayer, fromX, fromY, toX, toY) => {
  console.log(`🔍 isMoveLegal: (${fromX}, ${fromY}) → (${toX}, ${toY})`);

  // **範囲外チェック**
  if (toX < 0 || toX >= 9 || toY < 0 || toY >= 9) {
    console.log(`🚨 非合法手: 移動先 (${toX}, ${toY}) は盤外です！`);
    return false;
  }

  let tempBoard = JSON.parse(JSON.stringify(capBoard));
  let tempPiece = null;

  // **駒台から打つ場合**
  if (fromX === 9 || fromX === 10) {
    console.log("🎯 駒台からの駒を取得");

    // **駒台の配列が存在するかチェック**
    if (!capBoard.firstCaptured || !capBoard.secondCaptured) {
      console.log("🚨 非合法手: 駒台が初期化されていません！");
      return false;
    }

    if (fromX === 9) {
      if (fromY < 0 || fromY >= capBoard.firstCaptured.length) {
        console.log(
          `🚨 非合法手: 先手の駒台に駒がありません！（index: ${fromY}）`
        );
        return false;
      }
      tempPiece = capBoard.firstCaptured[fromY]; // **先手の駒台から取得**
    } else {
      if (fromY < 0 || fromY >= capBoard.secondCaptured.length) {
        console.log(
          `🚨 非合法手: 後手の駒台に駒がありません！（index: ${fromY}）`
        );
        return false;
      }
      tempPiece = capBoard.secondCaptured[fromY]; // **後手の駒台から取得**
    }

    if (!tempPiece) {
      console.log(`🚨 非合法手: 駒台に駒が存在しません！（index: ${fromY}）`);
      return false;
    }

    console.log(`📌 駒台の駒: ${tempPiece} を (${toX}, ${toY}) に打ちます！`);

    // **王手を回避できるか判定**
    console.log(`👑 王手回避チェック: ${tempPiece} を (${toX}, ${toY}) に打つ`);
    tempBoard[toX][toY] = tempPiece; // **駒を仮置き**
  } else {
    // **通常の駒の移動**
    const actualFromX = isFirstPlayer ? fromX : 8 - fromX;
    const actualFromY = isFirstPlayer ? fromY : 8 - fromY;

    if (!capBoard[actualFromX] || !capBoard[actualFromX][actualFromY]) {
      console.log(
        `🚨 非合法手: board[${actualFromX}][${actualFromY}] が存在しません！`
      );
      return false;
    }
    tempPiece = tempBoard[actualFromX][actualFromY];
    tempBoard[actualFromX][actualFromY] = null; // **元の位置を空に**
    tempBoard[toX][toY] = tempPiece; // **新しい位置に駒を置く**
  }

  // **王の位置を取得**
  const kingPosition = getKingPosition(tempBoard, isFirstPlayer);
  if (!kingPosition) {
    console.log("🚨 王の位置が見つかりません");
    return false;
  }

  // **移動後に王手がかかるかチェック**
  const isStillInCheck = isSquareAttacked(
    tempBoard,
    kingPosition.x,
    kingPosition.y,
    isFirstPlayer
  );

  console.log(
    `👑 王手チェック結果: ${
      isStillInCheck ? "🚨 王手回避失敗！" : "✅ 王手回避成功！"
    }`
  );

  if (isStillInCheck) {
    console.log(
      `🚨 非合法手！(${fromX}, ${fromY}) → (${toX}, ${toY}) は王手が掛かります！`
    );
    return false;
  }

  console.log(`✅ 合法手: (${fromX}, ${fromY}) → (${toX}, ${toY})`);
  return true;
};

// 駒台からの駒打ちが合法かチェック
const canDropPieceToBlockCheck = (
  board,
  kingPosition,
  toX,
  toY,
  isFirstPlayer,
  capturedPieces
) => {
  const availableDrops = isFirstPlayer
    ? capturedPieces.firstPlayer
    : capturedPieces.secondPlayer;

  for (const piece of availableDrops) {
    const tempBoard = JSON.parse(JSON.stringify(board));
    tempBoard[toX][toY] = piece.piece;

    if (
      !isSquareAttacked(
        tempBoard,
        kingPosition.x,
        kingPosition.y,
        isFirstPlayer
      )
    ) {
      console.log(
        `✅ 駒台の ${piece.piece} を (${toX}, ${toY}) に打てば王手回避！`
      );
      return true;
    }
  }

  return false;
};

const getAttackingPieces = (board, kingX, kingY, isFirstPlayer) => {
  const attackingPieces = [];
  const opponentPieces = isFirstPlayer
    ? [
        "p",
        "r",
        "b",
        "g",
        "s",
        "n",
        "l",
        "k",
        "pp",
        "pr",
        "pb",
        "ps",
        "pn",
        "pl",
      ]
    : [
        "P",
        "R",
        "B",
        "G",
        "S",
        "N",
        "L",
        "K",
        "PP",
        "PR",
        "PB",
        "PS",
        "PN",
        "PL",
      ];

  for (let fromX = 0; fromX < 9; fromX++) {
    for (let fromY = 0; fromY < 9; fromY++) {
      const piece = board[fromX][fromY];
      if (opponentPieces.includes(piece)) {
        const moveRule = pieceMovementRules[piece];

        if (
          moveRule &&
          moveRule(fromX, fromY, kingX, kingY, !isFirstPlayer, board)
        ) {
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

  console.log(
    `🔍 isPieceBlocking: 王(${kingPos.x}, ${kingPos.y}) → 攻撃駒(${attackerPos.x}, ${attackerPos.y})`
  );
  console.log(`🛠 チェックする経路: dx=${dx}, dy=${dy}`);

  while (x !== attackerPos.x || y !== attackerPos.y) {
    // ❌ `||` → ✅ `&&`
    console.log(`  🚶‍♂️ 経路チェック: (${x}, ${y})`);

    if (x === blockPos.x && y === blockPos.y) {
      console.log(
        `✅ 王と攻撃駒の間に駒がある！(${blockPos.x}, ${blockPos.y})`
      );
      return true; // 王手を防いでいる
    }

    // 縦 or 横の動き（片方の座標が変わらない場合）
    if (dx !== 0) x += dx;
    if (dy !== 0) y += dy;
  }

  console.log("❌ 王と攻撃駒の間に駒なし");
  return false;
};

// 王の移動が合法化をチェック
const isKingMoveLegal = (board, fromX, fromY, toX, toY, isFirstPlayer) => {
  // 移動先が盤外の場合
  if (toX < 0 || toX >= 9 || toY < 0 || toY >= 9) {
    return false;
  }

  const actualFromX = isFirstPlayer ? fromX : 8 - fromX;
  const actualFromY = isFirstPlayer ? fromY : 8 - fromY;

  // 移動先に自分の駒がある場合は不合法
  const targetPiece = board[toX][toY];
  if (targetPiece && isOwnPiece(targetPiece, isFirstPlayer)) {
    return false;
  }

  // 王を仮に移動して王手が掛かるかチェック
  const tempBoard = JSON.parse(JSON.stringify(board));
  tempBoard[actualFromX][actualFromY] = null;
  tempBoard[toX][toY] = isFirstPlayer ? "K" : "k";

  const kingPosition = { x: toX, y: toY };
  if (
    isSquareAttacked(tempBoard, kingPosition.x, kingPosition.y, isFirstPlayer)
  ) {
    return false;
  }

  return true;
};

// 王手を防いでいる駒を動かせないようにチェックする関数
const isPieceBlockingCheck = (board, fromX, fromY, toX, toY, isFirstPlayer) => {
  console.log("🔍 isPieceBlockingCheck 呼び出し");
  console.log(`👑 王の位置を取得 (${isFirstPlayer ? "先手" : "後手"})`);

  const kingPosition = getKingPosition(board, isFirstPlayer);
  if (!kingPosition) {
    console.log("🚨 王の位置が見つかりません");
    return false;
  }

  console.log(`👑 王の位置: (${kingPosition.x}, ${kingPosition.y})`);

  // 動かす駒が王なら判定をスキップ
  const piece = board[fromX][fromY];
  if (piece === (isFirstPlayer ? "K" : "k")) {
    return false;
  }

  // 仮に駒を動かしてみる
  const tempBoard = JSON.parse(JSON.stringify(board));
  tempBoard[fromX][fromY] = null;
  tempBoard[toX][toY] = board[fromX][fromY];

  // 仮に駒を動かした後に王手がかかるかどうかを判定
  const isKingInCheckAfterMove = isSquareAttacked(
    tempBoard,
    kingPosition.x,
    kingPosition.y,
    isFirstPlayer
  );

  if (isKingInCheckAfterMove) {
    console.log(`🚨 その駒 (${fromX}, ${fromY}) を動かすと王手が掛かります！`);
    return true; // 🔴 王手が掛かるので移動不可
  }

  console.log("✅ 王手を防いでいる駒ではないので移動可能");
  return false;
};

// 打ち歩詰めかどうかチェック
const isDropPawnMate = (board, toX, toY, isFirstPlayer, capturedPieces) => {
  console.log(
    `🔍 [isDropPawnMate] 歩を打った後の詰みチェック: (${toX}, ${toY})`
  );

  // 歩を打つ位置が有効かチェック
  if (!isValidDropPosition(isFirstPlayer ? "P" : "p", toX, isFirstPlayer)) {
    return false; // 無効な位置ならそもそも打てない
  }

  // 仮の盤面を作り、歩を打つ
  const tempBoard = JSON.parse(JSON.stringify(board));
  tempBoard[toX][toY] = isFirstPlayer ? "P" : "p"; // 仮に歩を打つ

  // 相手の王の位置を取得
  const opponentKingPosition = getKingPosition(tempBoard, !isFirstPlayer);
  if (!opponentKingPosition) {
    console.log(
      "🚨 [isDropPawnMate] 王の位置が見つからない → バグ防止のためfalse"
    );
    return false; // バグ防止のため false を返す
  }

  console.log(
    `👑 [isDropPawnMate] 相手の王の位置: (${opponentKingPosition.x}, ${opponentKingPosition.y})`
  );

  // ① 歩を打った結果、王手がかかるか？
  const isCheck = isSquareAttacked(
    tempBoard,
    opponentKingPosition.x,
    opponentKingPosition.y,
    !isFirstPlayer
  );
  if (!isCheck) {
    console.log("✅ [isDropPawnMate] 王手ではない → 打ち歩詰めではない");
    return false; // 王手でないならOK
  }

  console.log("⚠️ [isDropPawnMate] 王手 → 詰みの可能性あり");

  // ② 歩を打った結果、詰みになるか？
  const isMate = isKingInCheckmate(
    tempBoard,
    opponentKingPosition,
    !isFirstPlayer,
    capturedPieces
  );
  if (!isMate) {
    console.log("✅ [isDropPawnMate] 詰みではない → 打ち歩詰めではない");
    return false; // 詰みにならないならOK
  }

  console.log("⚠️ [isDropPawnMate] 歩を打つと詰み → 打ち歩詰めの可能性あり");

  // ③ 相手の王が逃げられるかチェック
  const kingCanEscape = canKingEscape(
    tempBoard,
    opponentKingPosition,
    !isFirstPlayer
  );
  if (kingCanEscape) {
    console.log("✅ [isDropPawnMate] 王に逃げ場がある → 打ち歩詰めではない");
    return false;
  }

  console.log("⚠️ [isDropPawnMate] 王に逃げ場がない → 更に検証");

  // ④ その歩を取ることができる駒があるかチェック
  const canCapturePawn = canPieceCapture(tempBoard, toX, toY, !isFirstPlayer);
  if (canCapturePawn) {
    console.log("✅ [isDropPawnMate] 歩を取れる駒がある → 打ち歩詰めではない");
    return false;
  }

  console.log(
    "🚨 [isDropPawnMate] 王に逃げ場がなく、歩も取れない → 打ち歩詰め成立！"
  );
  return true; // 王が逃げられず、歩を取ることもできない → 打ち歩詰め！
};

// isDropPawnMate関数の補助関数
const canKingEscape = (board, kingPos, isFirstPlayer) => {
  const kingMoves = [
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
  ];

  for (const move of kingMoves) {
    const newX = kingPos.x + move.dx;
    const newY = kingPos.y + move.dy;

    // 盤外ならスキップ
    if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9) continue;

    // 移動先に自分の駒がないか確認
    if (board[newX][newY] && isOwnPiece(board[newX][newY], isFirstPlayer))
      continue;

    // 移動先が攻撃されていないか確認
    if (!isSquareAttacked(board, newX, newY, !isFirstPlayer)) {
      console.log(`✅ [canKingEscape] 王は (${newX}, ${newY}) に逃げられる`);
      return true;
    }
  }

  console.log("🚨 [canKingEscape] 王の逃げ場なし");
  return false;
};

// isDropPawnMate関数の補助関数
const canPieceCapture = (board, x, y, isFirstPlayer) => {
  const opponentPieces = isFirstPlayer
    ? [
        "P",
        "R",
        "B",
        "G",
        "S",
        "N",
        "L",
        "PP",
        "PR",
        "PB",
        "PS",
        "PN",
        "PL",
      ]
    : [
        "p",
        "r",
        "b",
        "g",
        "s",
        "n",
        "l",
        "pp",
        "pr",
        "pb",
        "ps",
        "pn",
        "pl",
      ];

  for (let fromX = 0; fromX < 9; fromX++) {
    for (let fromY = 0; fromY < 9; fromY++) {
      const piece = board[fromX][fromY];

      if (opponentPieces.includes(piece)) {
        const moveRule = pieceMovementRules[piece];

        if (moveRule && moveRule(fromX, fromY, x, y, !isFirstPlayer, board)) {
          console.log(
            `✅ [canPieceCapture] ${piece} が (${fromX}, ${fromY}) から歩を取れる`
          );
          return true;
        }
      }
    }
  }

  console.log("🚨 [canPieceCapture] 歩を取れる駒なし");
  return false;
};

// 歩と桂馬と香車が打てる位置かどうかチェック
const isValidDropPosition = (piece, toX, isFirstPlayer) => {
  // 歩の打ち位置チェック
  if (piece.toLowerCase() === "p") {
    if ((isFirstPlayer && toX === 0) || (!isFirstPlayer && toX === 8)) {
      return false; // 相手陣営の1段目には打てない
    }
  }

  // 桂馬の打ち位置チェック
  if (piece.toLowerCase() === "n") {
    if ((isFirstPlayer && toX <= 1) || (!isFirstPlayer && toX >= 7)) {
      return false; // 相手陣営の1, 2段目には打てない
    }
  }

  // 香車の打ち位置チェック
  if (piece.toLowerCase() === "l") {
    if ((isFirstPlayer && toX === 0) || (!isFirstPlayer && toX === 8)) {
      return false; // 相手陣営の1段目には打てない
    }
  }

  return true;
}

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
    const board = room.board;

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

    console.log(actualToX, actualToY);

    // 指した（打った）場所の駒を取得
    const targetPiece = room.board[actualToX][actualToY];

    // ✅ `capBoard` を駒を削除する前に作成する
    const capBoard = JSON.parse(JSON.stringify(room.board));
    capBoard.firstCaptured = room.capturedPieces.firstPlayer.map(
      (piece) => piece.piece
    ); // 駒台のコピー
    capBoard.secondCaptured = room.capturedPieces.secondPlayer.map(
      (piece) => piece.piece
    ); // 駒台のコピー
    console.table(capBoard);

    // ✅ 駒台からの駒の場合
    if (fromX === 9) {
      console.log("🟢 先手の駒台から駒を取得");
      piece = board.firstCaptured[fromY]; // 駒台の駒を取得
      console.log(`駒台からの駒の位置 ${fromX} ${fromY}`);
    } else if (fromX === 10) {
      console.log("🟢 後手の駒台から駒を取得");
      piece = board.secondCaptured[fromY]; // 駒台の駒を取得
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
      const capFromX = fromX;
      const capFromY = fromY;

      // ✅ 4. 指そうとしている手が王手を回避するかチェック
      const isLegalMove = isMoveLegal(
        room.board,
        isFirstPlayer,
        capFromX,
        capFromY,
        actualToX,
        actualToY
      );

      // ✅ 5. 合駒が有効かチェック（駒台から駒を打つ場合）
      const isValidBlock =
        fromX === 9 || fromX === 10
          ? canDropPieceToBlockCheck(
              room.board,
              kingPosition,
              actualToX,
              actualToY,
              isFirstPlayer,
              room.capturedPieces
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

    // ✅ 王手を防いでいる駒を動かせないようにチェック
    if (fromX !== 9 && fromX !== 10 && isPieceBlockingCheck(room.board, actualFromX, actualFromY, actualToX, actualToY, isFirstPlayer)) {
      return res.status(400).json({ message: "その駒は王手を防いでいるので動かせません！" });
    }

    // ✅ 自分の駒かチェック
    let isOwnPieceFlag =
      (isFirstPlayer && piece === piece.toUpperCase()) ||
      (!isFirstPlayer && piece === piece.toLowerCase());

    // ✅ 駒台から出す場合は必ず自分の駒と判定
    if (fromX === 9 || fromX === 10) {
      isOwnPieceFlag = true;
    }

    if (!isOwnPieceFlag) {
      return res.status(400).json({ message: "相手の駒は動かせません" });
    }

    // ✅ 駒台からの駒の場合、二歩のチェックを追加
    if ((fromX === 9 || fromX === 10) && piece.toLowerCase() === "p") {
      for (let x = 0; x < 9; x++) {
        const existingPiece = board[x][actualToY];
        if (
          existingPiece &&
          isOwnPiece(existingPiece, isFirstPlayer) &&
          existingPiece.toLowerCase() === "p"
        ) {
          return res.status(400).json({ message: "二歩は禁止されています！" });
        }
      }

      // ✅ 打ち歩詰めのチェックを追加
      if (isDropPawnMate(room.board, actualToX, actualToY, isFirstPlayer, room.capturedPieces)) {
        return res.status(400).json({ message: "打ち歩詰めは禁止です！" });
      }
    }

    // 打った場所が合法かチェック
    if((fromX === 9 || fromX === 10) && !isValidDropPosition(piece, actualToX, isFirstPlayer)) {
      return res.status(400).json({ message: "その位置には打てません！" });
    }

    // ✅ 駒台からの駒の場合、王手回避が確認された後に駒を削除
    if (fromX === 9) {
      if (!targetPiece) {
        board.firstCaptured.splice(fromY, 1); // 取得した駒を削除
        room.capturedPieces.firstPlayer.splice(fromY, 1); // capturedPieces からも削除
      }
    } else if (fromX === 10) {
      if (!targetPiece) {
        board.secondCaptured.splice(fromY, 1); // 取得した駒を削除
        room.capturedPieces.secondPlayer.splice(fromY, 1); // capturedPieces からも削除
      }
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
      return res.status(400).json({ message: "不正な移動です" });
    }

    // 王の移動が合法かチェック
    if (piece === "K" || piece === "k") {
      if (
        !isKingMoveLegal(
          room.board,
          actualFromX,
          actualFromY,
          actualToX,
          actualToY,
          isFirstPlayer
        )
      ) {
        return res
          .status(400)
          .json({ message: "王手が掛かるため、その手は指せません" });
      }
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

    // ✅ 11. クライアントに更新を通知する前にログを出力

    console.log(`🚀 [${roomId}] update-board 発火！`);
    req.app.get("io").to(roomId).emit("update-board", {
      roomId,
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
      if (
        isKingInCheckmate(
          room.board,
          opponentKingPosition,
          !isFirstPlayer,
          room.capturedPieces
        )
      ) {
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

// 成れる駒の移動が合法化をチェックするapi
router.post("/validate-move", function (req, res) {
  try {
    const { roomId, userId, fromX, fromY, toX, toY } = req.body;
    const rooms = req.app.get("rooms");
    const room = rooms[roomId];

    if (!room || !room.gameStarted) {
      return res.status(400).json({ message: "ゲームが開始されていません" });
    }

    if (room.currentPlayer !== userId) {
      return res.status(400).json({ message: "あなたのターンではありません" });
    }

    const isFirstPlayer = room.currentPlayer === room.firstPlayer.id;
    const board = room.board;

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

    console.log(actualToX, actualToY);

    // 指した（打った）場所の駒を取得
    const targetPiece = room.board[actualToX][actualToY];

    // ✅ `capBoard` を駒を削除する前に作成する
    const capBoard = JSON.parse(JSON.stringify(room.board));
    capBoard.firstCaptured = room.capturedPieces.firstPlayer.map(
      (piece) => piece.piece
    ); // 駒台のコピー
    capBoard.secondCaptured = room.capturedPieces.secondPlayer.map(
      (piece) => piece.piece
    ); // 駒台のコピー
    console.table(capBoard);

    // ✅ 駒台からの駒の場合
    if (fromX === 9) {
      console.log("🟢 先手の駒台から駒を取得");
      piece = board.firstCaptured[fromY]; // 駒台の駒を取得
      console.log(`駒台からの駒の位置 ${fromX} ${fromY}`);
    } else if (fromX === 10) {
      console.log("🟢 後手の駒台から駒を取得");
      piece = board.secondCaptured[fromY]; // 駒台の駒を取得
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
      const capFromX = fromX;
      const capFromY = fromY;

      // ✅ 4. 指そうとしている手が王手を回避するかチェック
      const isLegalMove = isMoveLegal(
        room.board,
        isFirstPlayer,
        capFromX,
        capFromY,
        actualToX,
        actualToY
      );

      // ✅ 5. 合駒が有効かチェック（駒台から駒を打つ場合）
      const isValidBlock =
        fromX === 9 || fromX === 10
          ? canDropPieceToBlockCheck(
              room.board,
              kingPosition,
              actualToX,
              actualToY,
              isFirstPlayer,
              room.capturedPieces
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

    // ✅ 王手を防いでいる駒を動かせないようにチェック
    if (
      fromX !== 9 &&
      fromX !== 10 &&
      isPieceBlockingCheck(
        room.board,
        actualFromX,
        actualFromY,
        actualToX,
        actualToY,
        isFirstPlayer
      )
    ) {
      return res
        .status(400)
        .json({ message: "その駒は王手を防いでいるので動かせません！" });
    }

    // ✅ 自分の駒かチェック
    let isOwnPieceFlag =
      (isFirstPlayer && piece === piece.toUpperCase()) ||
      (!isFirstPlayer && piece === piece.toLowerCase());

    // ✅ 駒台から出す場合は必ず自分の駒と判定
    if (fromX === 9 || fromX === 10) {
      isOwnPieceFlag = true;
    }

    if (!isOwnPieceFlag) {
      return res.status(400).json({ message: "相手の駒は動かせません" });
    }

    // ✅ 駒台からの駒の場合、二歩のチェックを追加
    if ((fromX === 9 || fromX === 10) && piece.toLowerCase() === "p") {
      for (let x = 0; x < 9; x++) {
        const existingPiece = board[x][actualToY];
        if (
          existingPiece &&
          isOwnPiece(existingPiece, isFirstPlayer) &&
          existingPiece.toLowerCase() === "p"
        ) {
          return res.status(400).json({ message: "二歩は禁止されています！" });
        }
      }

      // ✅ 打ち歩詰めのチェックを追加
      if (
        isDropPawnMate(
          room.board,
          actualToX,
          actualToY,
          isFirstPlayer,
          room.capturedPieces
        )
      ) {
        return res.status(400).json({ message: "打ち歩詰めは禁止です！" });
      }
    }

    // 打った場所が合法かチェック
    if (
      (fromX === 9 || fromX === 10) &&
      !isValidDropPosition(piece, actualToX, isFirstPlayer)
    ) {
      return res.status(400).json({ message: "その位置には打てません！" });
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
      return res.status(400).json({ message: "不正な移動です" });
    }

    // 王の移動が合法かチェック
    if (piece === "K" || piece === "k") {
      if (
        !isKingMoveLegal(
          room.board,
          actualFromX,
          actualFromY,
          actualToX,
          actualToY,
          isFirstPlayer
        )
      ) {
        return res
          .status(400)
          .json({ message: "王手が掛かるため、その手は指せません" });
      }
    }

    res.json({ message: "移動は合法です" });
  } catch (error) {
    console.error("❌ サーバーでエラー発生:", error);
    res.status(500).json({ message: "サーバー内部エラー" });
  }
});

router.post("/resign", function (req, res) {
  try {
    const { roomId, userId } = req.body;
    const rooms = req.app.get("rooms");
    const room = rooms[roomId];

    if (!room || !room.gameStarted) {
      return res.status(400).json({ message: "ゲームが開始されていません" });
    }

    const isFirstPlayer = room.firstPlayer.id === userId;
    const isSecondPlayer = room.secondPlayer.id === userId;

    let winner = null;

    if (isFirstPlayer) {
      winner = room.secondPlayer.id;
    } else if (isSecondPlayer) {
      winner = room.firstPlayer.id;
    }

    if (winner) {
      req.app.get("io").to(roomId).emit("game-over", {
        message: "対戦相手が降参しました！",
        winner,
      });
      console.log(`🎉 勝者: ${winner}`);
      delete rooms[roomId]; // 部屋を削除
    }

    res.json({ message: "降参しました" });
  } catch (error) {
    console.error("❌ サーバーでエラー発生:", error);
    res.status(500).json({ message: "サーバー内部エラー" });
  }
});

module.exports = { router, initializeBoard };
