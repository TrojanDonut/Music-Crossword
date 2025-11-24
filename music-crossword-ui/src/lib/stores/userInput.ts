/**
 * Svelte store for user input state
 */

import { writable, derived, get } from 'svelte/store';
import type { GridState, ValidationState } from '$lib/types/puzzle';
import { puzzleStore } from './puzzle';
import { validateGrid, getCompletionPercentage } from '$lib/utils/validation';

export const userInput = writable<GridState>([]);
export const activeClueIndex = writable<number | null>(null);
export const activeCellPosition = writable<{ row: number; col: number } | null>(null);

/**
 * Initialize an empty grid based on puzzle dimensions
 */
export function initializeGrid(rows: number, cols: number) {
  const grid: GridState = Array(rows).fill(null).map(() => Array(cols).fill(null));
  userInput.set(grid);
}

/**
 * Set a cell value in the grid
 */
export function setCellValue(row: number, col: number, value: string | null) {
  userInput.update(grid => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value;
    return newGrid;
  });
}

/**
 * Clear a cell in the grid
 */
export function clearCell(row: number, col: number) {
  setCellValue(row, col, null);
}

/**
 * Clear the entire grid
 */
export function clearGrid() {
  const puzzle = get(puzzleStore).puzzle;
  if (puzzle) {
    initializeGrid(puzzle.layout.rows, puzzle.layout.cols);
  }
}

/**
 * Set the active clue
 */
export function setActiveClue(index: number | null) {
  activeClueIndex.set(index);
}

/**
 * Set the active cell position
 */
export function setActiveCell(row: number, col: number) {
  activeCellPosition.set({ row, col });
}

/**
 * Derived store for validation results
 */
export const validation = derived(
  [userInput, puzzleStore],
  ([$userInput, $puzzleStore]) => {
    if (!$puzzleStore.puzzle) return new Map();
    return validateGrid($puzzleStore.puzzle.layout.result, $userInput);
  }
);

/**
 * Derived store for completion status
 */
export const completionStatus = derived(
  [userInput, puzzleStore, validation],
  ([$userInput, $puzzleStore, $validation]) => {
    if (!$puzzleStore.puzzle) {
      return { solved: 0, total: 0, percentage: 0, isComplete: false };
    }
    
    const total = $puzzleStore.puzzle.layout.result.length;
    const solved = Array.from($validation.values()).filter(v => v === true).length;
    const percentage = getCompletionPercentage($puzzleStore.puzzle.layout.result, $userInput);
    const isComplete = solved === total;
    
    return { solved, total, percentage, isComplete };
  }
);

/**
 * Save progress to localStorage
 */
export function saveProgress(puzzleId: number) {
  const grid = get(userInput);
  localStorage.setItem(`puzzle_${puzzleId}_progress`, JSON.stringify(grid));
}

/**
 * Load progress from localStorage
 */
export function loadProgress(puzzleId: number): GridState | null {
  const saved = localStorage.getItem(`puzzle_${puzzleId}_progress`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear saved progress
 */
export function clearProgress(puzzleId: number) {
  localStorage.removeItem(`puzzle_${puzzleId}_progress`);
}

