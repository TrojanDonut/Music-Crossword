/**
 * Pitch mapping utilities for musical crossword puzzle
 * Maps musical notes (C, C#, D, etc.) to grid letters (C, D, E, etc.)
 * and vice versa for display purposes
 */

/**
 * Maps musical notes to crossword grid letters
 * (Same mapping as crossword_generator.js)
 */
export const PITCH_MAP: Record<string, string> = {
  'C': 'C',
  'C#': 'D',
  'Db': 'D',
  'D': 'E',
  'D#': 'F',
  'Eb': 'F',
  'E': 'G',
  'F': 'H',
  'F#': 'I',
  'Gb': 'I',
  'G': 'J',
  'G#': 'K',
  'Ab': 'K',
  'A': 'L',
  'A#': 'M',
  'Bb': 'M',
  'B': 'N'
};

/**
 * Reverse mapping: grid letter → musical note
 * Used for displaying notes to users
 */
export const REVERSE_PITCH_MAP: Record<string, string> = {
  'C': 'C',
  'D': 'C#',
  'E': 'D',
  'F': 'D#',
  'G': 'E',
  'H': 'F',
  'I': 'F#',
  'J': 'G',
  'K': 'G#',
  'L': 'A',
  'M': 'A#',
  'N': 'B'
};

/**
 * All chromatic notes in order
 */
export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert a grid letter to a musical note for display
 * Replaces # with the proper sharp symbol ♯
 */
export function letterToNote(letter: string): string {
  const note = REVERSE_PITCH_MAP[letter.toUpperCase()];
  if (!note) return letter;
  return note.replace('#', '♯');
}

/**
 * Convert a musical note to a grid letter for internal storage
 */
export function noteToLetter(note: string): string {
  const normalized = note.replace('♯', '#');
  return PITCH_MAP[normalized] || note;
}

/**
 * Get a display-friendly note name with proper sharp symbol
 */
export function getNoteDisplayName(note: string): string {
  return note.replace('#', '♯');
}

/**
 * Parse a pitch sequence string (space-separated) to an array of notes
 */
export function parsePitchSequence(pitchSequence: string): string[] {
  return pitchSequence.trim().split(/\s+/);
}

/**
 * Convert pitch sequence to grid letters for crossword
 */
export function pitchSequenceToGridLetters(pitchSequence: string): string {
  const notes = parsePitchSequence(pitchSequence);
  return notes.map(note => noteToLetter(note)).join('');
}

