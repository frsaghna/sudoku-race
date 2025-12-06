// Sudoku Board Utilities for Sudoku Race Game
// All helpers are pure functions and safe for server-side

/** Replace char in string at index. */
export function replaceChar(str: string, index: number, newChar: string): string {
  return str.substring(0, index) + newChar + str.substring(index + 1);
}

/** Get all cells as 2D array from 81-char string. */
export function stringToGrid(board: string): string[][] {
  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => board[r * 9 + c]));
}

/** Transform 2D grid to 81-char string. */
export function gridToString(grid: string[][]): string {
  return grid.flat().join("");
}

/** Checks whether board is complete (equals solution). */
export function isBoardComplete(board: string, solution: string): boolean {
  return board === solution;
}

/** Get indices of clues (original values, not empty) in puzzle string. */
export function clueIndices(puzzle: string): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i < puzzle.length; ++i) {
    if (puzzle[i] !== "0") set.add(i);
  }
  return set;
}

/** Check if move is on a clue. */
export function isClue(puzzle: string, cell: number): boolean {
  return puzzle[cell] !== "0";
}

/** Returns number of correct filled cells for progress bar. */
export function countCorrectFilled(puzzle: string, board: string, solution: string): number {
  let count = 0;
  for (let i = 0; i < 81; ++i) {
    if (puzzle[i] === "0" && board[i] === solution[i]) count++;
  }
  return count;
}

/** Returns number of empty cells in puzzle. */
export function countTotalEmpty(puzzle: string): number {
  return [...puzzle].filter(c => c === "0").length;
}

/** Calculate progress ratio for a player's board. */
export function calculatePlayerProgress(puzzle: string, board: string, solution: string): number {
  const correct = countCorrectFilled(puzzle, board, solution);
  const total = countTotalEmpty(puzzle);
  if (total === 0) return 1; // Avoid div by zero
  return correct / total;
}

/** Checks if all fillable cells match the solution (used for win check). */
export function isSudokuComplete(board: string, solution: string): boolean {
  return board === solution;
}
