const {
  initializeBoard,
  pieceMovementRules,
  isDropPawnMate,
  initializeCapturedPieces,
} = require("./shogi");

test("飛車が駒を通り越して移動できないことを確認する", () => {
  const board = initializeBoard();

  // 初期状態のボードを確認
  console.table(board);

  // 飛車を(7, 7)から(5, 7)に移動しようとする
  const result = pieceMovementRules.R(7, 7, 5, 7, board);

  // 移動が失敗することを確認
  expect(result).toBe(false);
});

test("飛車が駒を通り越して移動できないことを確認する（横移動）", () => {
  const board = initializeBoard();

  // 初期状態のボードを確認
  console.table(board);

  // 飛車を(7, 7)から(7, 5)に移動しようとする
  const result = pieceMovementRules.R(7, 7, 7, 5, board);

  // 移動が失敗することを確認
  expect(result).toBe(false);
});

test("打ち歩詰めが成立することを確認する", () => {
  const board = initializeBoard();
  const capturedPieces = initializeCapturedPieces();

  // 王を詰ませるための駒配置
  board[0][6] = "k"; // 後手の玉を配置
  board[1][6] = null; // 後手の玉の前を空ける
  board[2][6] = "P"; // 先手の歩を玉の前に配置
  board[0][5] = "R"; // 先手の飛車を配置して王手

  // 先手の駒台に歩を追加
  capturedPieces.firstPlayer.push({ piece: "P" });

  // 打ち歩詰めのチェック
  const result = isDropPawnMate(board, 1, 6, true, capturedPieces);

  // 打ち歩詰めが成立することを確認
  expect(result).toBe(true);
});

test("打ち歩詰めが成立しないことを確認する", () => {
  const board = initializeBoard();
  const capturedPieces = initializeCapturedPieces();

  // 王を詰ませるための駒配置
  board[0][6] = "k"; // 後手の玉を配置
  board[1][6] = null; // 後手の玉の前を空ける
  board[2][6] = "P"; // 先手の歩を玉の前に配置
  board[0][5] = "R"; // 先手の飛車を配置して王手

  // 先手の駒台に歩を追加
  capturedPieces.firstPlayer.push({ piece: "P" });

  // 玉の逃げ道を作る
  board[0][7] = null;

  // 打ち歩詰めのチェック
  const result = isDropPawnMate(board, 1, 6, true, capturedPieces);

  // 打ち歩詰めが成立しないことを確認
  expect(result).toBe(false);
});
