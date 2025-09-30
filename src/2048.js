import React from "react";

const SIZE = 4;

// helper functions:
function emptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function getEmptyCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile(board) {
  const empties = getEmptyCells(board);
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = board.map(row => row.slice());
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

export default function Game2048() {
  return (<>

  </>);
}