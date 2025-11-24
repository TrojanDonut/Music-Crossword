// TypeScript type definitions for the musical crossword puzzle

export interface Motif {
  id: number;
  pitch_sequence: string;
  rhythm_sequence: string | null;
  interval_profile: string;
  length: number;
  first_pitch: string;
  last_pitch: string;
  difficulty: number;
  descriptor: string | null;
  source_id: number;
  recognition_score: number;
}

export interface PuzzleLayout {
  rows: number;
  cols: number;
  table: string[][];
  result: Clue[];
}

export interface Clue {
  clue: string;
  answer: string;
  position: { x: number; y: number };
  orientation: 'across' | 'down';
  motif_id: number;
  startx: number;
  starty: number;
  motif?: Motif; // Optional: enriched with motif data from API
}

export interface Puzzle {
  id: number;
  layout: PuzzleLayout;
  motif_ids: number[];
  difficulty: number;
  created_at: string;
}

export type GridCell = string | null;
export type GridState = GridCell[][];

export type ValidationState = Map<number, boolean>;

export interface CellValidation {
  isCorrect: boolean | null;
  value: string | null;
}

