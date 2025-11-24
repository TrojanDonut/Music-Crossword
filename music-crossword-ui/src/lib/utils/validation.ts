/**
 * Validation logic for checking answers in the musical crossword
 */

import type { Clue, GridState, ValidationState } from '$lib/types/puzzle';

/**
 * Check if a word (melody) is correctly filled in the grid
 * @param clue - The clue to check
 * @param grid - Current grid state with user input
 * @returns true if the word is completely correct
 */
export function isWordCorrect(clue: Clue, grid: GridState): boolean {
  const { position, orientation, answer } = clue;
  let { x, y } = position;
  
  // Check if grid is properly initialized
  if (!grid || grid.length === 0 || !grid[0]) {
    return false;
  }
  
  for (let i = 0; i < answer.length; i++) {
    const expectedLetter = answer[i];
    
    // Check bounds
    if (y >= grid.length || x >= grid[0].length) {
      return false;
    }
    
    // Check if row exists
    if (!grid[y]) {
      return false;
    }
    
    const actualValue = grid[y][x];
    
    // Check if cell matches expected letter
    if (actualValue !== expectedLetter) {
      return false;
    }
    
    // Move to next cell
    if (orientation === 'across') {
      x++;
    } else {
      y++;
    }
  }
  
  return true;
}

/**
 * Check if a word is completely filled (regardless of correctness)
 * @param clue - The clue to check
 * @param grid - Current grid state
 * @returns true if all cells are filled
 */
export function isWordFilled(clue: Clue, grid: GridState): boolean {
  const { position, orientation, answer } = clue;
  let { x, y } = position;
  
  // Check if grid is properly initialized
  if (!grid || grid.length === 0 || !grid[0]) {
    return false;
  }
  
  for (let i = 0; i < answer.length; i++) {
    if (y >= grid.length || x >= grid[0].length) {
      return false;
    }
    
    // Check if row exists
    if (!grid[y]) {
      return false;
    }
    
    if (grid[y][x] === null || grid[y][x] === '') {
      return false;
    }
    
    if (orientation === 'across') {
      x++;
    } else {
      y++;
    }
  }
  
  return true;
}

/**
 * Validate entire grid and return results for each clue
 * @param clues - All clues in the puzzle
 * @param grid - Current grid state
 * @returns Map of clue index to validation result
 */
export function validateGrid(
  clues: Clue[],
  grid: GridState
): ValidationState {
  const results = new Map<number, boolean>();
  
  // Return empty results if grid is not initialized
  if (!grid || grid.length === 0) {
    clues.forEach((_, index) => {
      results.set(index, false);
    });
    return results;
  }
  
  clues.forEach((clue, index) => {
    if (isWordFilled(clue, grid)) {
      results.set(index, isWordCorrect(clue, grid));
    } else {
      results.set(index, false);
    }
  });
  
  return results;
}

/**
 * Get the cells that belong to a specific clue
 * @param clue - The clue
 * @returns Array of [row, col] coordinates
 */
export function getClueCells(clue: Clue): [number, number][] {
  const cells: [number, number][] = [];
  let { x, y } = clue.position;
  
  for (let i = 0; i < clue.answer.length; i++) {
    cells.push([y, x]);
    
    if (clue.orientation === 'across') {
      x++;
    } else {
      y++;
    }
  }
  
  return cells;
}

/**
 * Find which clue (if any) contains a specific cell
 * @param clues - All clues
 * @param row - Cell row
 * @param col - Cell column
 * @returns Array of clue indices that contain this cell
 */
export function findCluesAtCell(clues: Clue[], row: number, col: number): number[] {
  const result: number[] = [];
  
  clues.forEach((clue, index) => {
    const cells = getClueCells(clue);
    if (cells.some(([r, c]) => r === row && c === col)) {
      result.push(index);
    }
  });
  
  return result;
}

/**
 * Calculate puzzle completion percentage
 * @param clues - All clues
 * @param grid - Current grid state
 * @returns Completion percentage (0-100)
 */
export function getCompletionPercentage(clues: Clue[], grid: GridState): number {
  if (!clues || clues.length === 0) {
    return 0;
  }
  
  const validation = validateGrid(clues, grid);
  const correctCount = Array.from(validation.values()).filter(v => v === true).length;
  return Math.round((correctCount / clues.length) * 100);
}

