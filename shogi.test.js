const { initializeBoard, pieceMovementRules } = require('./shogi');

test('飛車が駒を通り越して移動できないことを確認する', () => {
  const board = initializeBoard();

  // 初期状態のボードを確認
  console.table(board);

  // 飛車を(7, 7)から(5, 7)に移動しようとする
  const result = pieceMovementRules.R(7, 7, 5, 7, board);

  // 移動が失敗することを確認
  expect(result).toBe(false);
});

test('飛車が駒を通り越して移動できないことを確認する（横移動）', () => {
  const board = initializeBoard();

  // 初期状態のボードを確認
  console.table(board);

  // 飛車を(7, 7)から(7, 5)に移動しようとする
  const result = pieceMovementRules.R(7, 7, 7, 5, board);

  // 移動が失敗することを確認
  expect(result).toBe(false);
});