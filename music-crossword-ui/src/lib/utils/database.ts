/**
 * Database utilities for accessing SQLite database
 */

import Database from 'better-sqlite3';
import type { Puzzle, PuzzleLayout, Motif } from '$lib/types/puzzle';
import { dev } from '$app/environment';

let db: Database.Database | null = null;

/**
 * Get or create database connection
 * Only initializes on server-side
 */
function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Database should only be accessed server-side');
  }
  
  if (!db) {
    try {
      // Database is in the parent directory
      const dbPath = process.env.DATABASE_PATH || '../music_crossword.db';
      db = new Database(dbPath, { readonly: true });
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }
  
  return db;
}

/**
 * Get all puzzles from the database
 */
export function getPuzzles(): Puzzle[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, layout_json, motif_ids, difficulty, created_at
    FROM puzzles
    ORDER BY created_at DESC
  `).all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    layout: JSON.parse(row.layout_json) as PuzzleLayout,
    motif_ids: JSON.parse(row.motif_ids) as number[],
    difficulty: row.difficulty,
    created_at: row.created_at
  }));
}

/**
 * Get a specific puzzle by ID
 */
export function getPuzzle(id: number): Puzzle | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, layout_json, motif_ids, difficulty, created_at
    FROM puzzles
    WHERE id = ?
  `).get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    layout: JSON.parse(row.layout_json) as PuzzleLayout,
    motif_ids: JSON.parse(row.motif_ids) as number[],
    difficulty: row.difficulty,
    created_at: row.created_at
  };
}

/**
 * Get a specific motif by ID
 */
export function getMotif(id: number): Motif | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, pitch_sequence, rhythm_sequence, interval_profile, length, 
           first_pitch, last_pitch, difficulty, descriptor, 
           source_id, recognition_score
    FROM motifs
    WHERE id = ?
  `).get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    pitch_sequence: row.pitch_sequence,
    rhythm_sequence: row.rhythm_sequence,
    interval_profile: row.interval_profile,
    length: row.length,
    first_pitch: row.first_pitch,
    last_pitch: row.last_pitch,
    difficulty: row.difficulty,
    descriptor: row.descriptor,
    source_id: row.source_id,
    recognition_score: row.recognition_score || 5
  };
}

/**
 * Get multiple motifs by their IDs
 */
export function getMotifs(ids: number[]): Motif[] {
  if (ids.length === 0) return [];
  
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT id, pitch_sequence, rhythm_sequence, interval_profile, length, 
           first_pitch, last_pitch, difficulty, descriptor, 
           source_id, recognition_score
    FROM motifs
    WHERE id IN (${placeholders})
  `).all(...ids) as any[];
  
  return rows.map(row => ({
    id: row.id,
    pitch_sequence: row.pitch_sequence,
    rhythm_sequence: row.rhythm_sequence,
    interval_profile: row.interval_profile,
    length: row.length,
    first_pitch: row.first_pitch,
    last_pitch: row.last_pitch,
    difficulty: row.difficulty,
    descriptor: row.descriptor,
    source_id: row.source_id,
    recognition_score: row.recognition_score || 5
  }));
}

/**
 * Get puzzle count
 */
export function getPuzzleCount(): number {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM puzzles').get() as any;
  return result.count;
}

/**
 * Get motif count
 */
export function getMotifCount(): number {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM motifs').get() as any;
  return result.count;
}

