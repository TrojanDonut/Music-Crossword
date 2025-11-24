/**
 * Svelte store for puzzle state
 */

import { writable, derived } from 'svelte/store';
import type { Puzzle, Clue } from '$lib/types/puzzle';

interface PuzzleState {
  puzzle: Puzzle | null;
  loading: boolean;
  error: string | null;
}

const initialState: PuzzleState = {
  puzzle: null,
  loading: false,
  error: null
};

export const puzzleStore = writable<PuzzleState>(initialState);

/**
 * Load a puzzle from the API
 */
export async function loadPuzzle(id: number) {
  puzzleStore.update(state => ({ ...state, loading: true, error: null }));
  
  try {
    const response = await fetch(`/api/puzzles/${id}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load puzzle');
    }
    
    puzzleStore.set({
      puzzle: data.puzzle,
      loading: false,
      error: null
    });
  } catch (error) {
    puzzleStore.set({
      puzzle: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Reset puzzle state
 */
export function resetPuzzle() {
  puzzleStore.set(initialState);
}

/**
 * Derived store for clues
 */
export const clues = derived(
  puzzleStore,
  ($puzzleStore) => $puzzleStore.puzzle?.layout.result || []
);

/**
 * Derived store for across clues
 */
export const acrossClues = derived(
  clues,
  ($clues) => $clues.filter((clue: Clue) => clue.orientation === 'across')
);

/**
 * Derived store for down clues
 */
export const downClues = derived(
  clues,
  ($clues) => $clues.filter((clue: Clue) => clue.orientation === 'down')
);

