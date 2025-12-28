/**
 * Svelte store for user input state
 */

import { writable, derived, get } from 'svelte/store';
import type { GridState, ValidationState, Clue } from '$lib/types/puzzle';
import { puzzleStore } from './puzzle';
import { validateGrid, getCompletionPercentage } from '$lib/utils/validation';
import { noteToLetter, parsePitchSequence } from '$lib/utils/pitchMapping';

export const userInput = writable<GridState>([]);
export const activeClueIndex = writable<number | null>(null);
export const activeCellPosition = writable<{ row: number; col: number } | null>(null);
export const firstNotePositions = writable<Set<string>>(new Set()); // Track first note positions as "row,col"

/**
 * Extract pitch class from a note (e.g., "C4" -> "C", "F#5" -> "F#")
 */
function extractPitchClass(note: string): string {
  const match = note.match(/^([A-G][#b]?)/);
  return match ? match[1] : note;
}

/**
 * Get the first note from a pitch sequence
 */
function getFirstNote(pitchSequence: string): string | null {
  if (!pitchSequence) return null;
  const notes = parsePitchSequence(pitchSequence);
  if (notes.length === 0) return null;
  return extractPitchClass(notes[0]);
}

/**
 * Ensure first notes are populated in the grid
 */
export function ensureFirstNotes(grid: GridState, clues: Clue[], rows: number, cols: number): GridState {
  const newGrid = grid.map(r => [...r]);
  const firstNoteSet = new Set<string>();
  
  clues.forEach((clue) => {
    if (clue.motif?.pitch_sequence) {
      const firstNote = getFirstNote(clue.motif.pitch_sequence);
      if (firstNote) {
        const gridLetter = noteToLetter(firstNote);
        const { x, y } = clue.position;
        // Make sure we're within bounds and cell exists
        // Always set first note, even if cell already has a value (overwrite)
        if (y < rows && x < cols && newGrid[y]) {
          newGrid[y][x] = gridLetter;
          firstNoteSet.add(`${y},${x}`);
          console.log(`Placed first note ${firstNote} (${gridLetter}) at position (${x}, ${y}) for clue: ${clue.clue}`);
        }
      }
    } else {
      console.log(`Clue "${clue.clue}" has no motif data`);
    }
  });
  
  // Update the first note positions store
  firstNotePositions.set(firstNoteSet);
  
  return newGrid;
}

/**
 * Initialize a grid based on puzzle dimensions
 * Optionally pre-populates the first note of each clue
 */
export function initializeGrid(rows: number, cols: number, clues?: Clue[]) {
  const grid: GridState = Array(rows).fill(null).map(() => Array(cols).fill(null));
  
  // Pre-populate first note of each clue if clues are provided
  if (clues && clues.length > 0) {
    const gridWithFirstNotes = ensureFirstNotes(grid, clues, rows, cols);
    userInput.set(gridWithFirstNotes);
  } else {
    userInput.set(grid);
  }
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
 * Clear the entire grid (but keep first notes)
 */
export function clearGrid() {
  const puzzle = get(puzzleStore).puzzle;
  if (puzzle) {
    initializeGrid(puzzle.layout.rows, puzzle.layout.cols, puzzle.layout.result);
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

