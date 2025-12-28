/**
 * Database utilities for accessing SQLite database
 */

import Database from 'better-sqlite3';
import type { Puzzle, PuzzleLayout, Motif } from '$lib/types/puzzle';
import { dev } from '$app/environment';
import { createHash } from 'crypto';

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
      // Remove readonly to allow write operations
      db = new Database(dbPath);
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
 * Get all motifs from the database
 */
export function getAllMotifs(): Motif[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, pitch_sequence, rhythm_sequence, interval_profile, length, 
           first_pitch, last_pitch, difficulty, descriptor, 
           source_id, recognition_score
    FROM motifs
    ORDER BY descriptor ASC, id ASC
  `).all() as any[];
  
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
 * Get motif count
 */
export function getMotifCount(): number {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM motifs').get() as any;
  return result.count;
}

/**
 * Extract pitch class from note (e.g., "C4" -> "C", "F#4" -> "F#")
 */
function extractPitchClass(note: string): string {
  const match = note.match(/^([A-G][#b]?)/);
  return match ? match[1] : note;
}

/**
 * Extract octave from note (e.g., "C4" -> 4, "F#5" -> 5)
 */
function extractOctave(note: string): number {
  const match = note.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 4;
}

/**
 * Calculate interval profile from pitch sequence
 */
function calculateIntervalProfile(pitchSequence: string): string {
  const pitchMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const notes = pitchSequence.trim().split(/\s+/);
  if (notes.length < 2) return '';
  
  const intervals: string[] = [];
  for (let i = 1; i < notes.length; i++) {
    const currentNote = notes[i - 1];
    const nextNote = notes[i];
    
    const currentPitch = extractPitchClass(currentNote);
    const currentOctave = extractOctave(currentNote);
    const nextPitch = extractPitchClass(nextNote);
    const nextOctave = extractOctave(nextNote);
    
    const currentSemi = (pitchMap[currentPitch] ?? 0) + currentOctave * 12;
    const nextSemi = (pitchMap[nextPitch] ?? 0) + nextOctave * 12;
    const interval = nextSemi - currentSemi;
    
    intervals.push(`${interval >= 0 ? '+' : ''}${interval}`);
  }
  
  return intervals.join(' ');
}

/**
 * Calculate checksum for pitch sequence
 */
function calculateChecksum(pitchSequence: string): string {
  const normalized = pitchSequence.trim().toUpperCase();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Create a new motif
 */
export function createMotif(data: {
  descriptor: string;
  pitch_sequence: string;
  rhythm_sequence?: string | null;
  difficulty: number;
  recognition_score: number;
}): number {
  const db = getDb();
  
  const notes = data.pitch_sequence.trim().split(/\s+/);
  const length = notes.length;
  const firstPitch = extractPitchClass(notes[0] || '');
  const lastPitch = extractPitchClass(notes[notes.length - 1] || '');
  const intervalProfile = calculateIntervalProfile(data.pitch_sequence);
  const checksum = calculateChecksum(data.pitch_sequence);
  
  // Get or create a default source (user-contributed)
  let sourceRow = db.prepare('SELECT id FROM sources WHERE dataset_name = ?').get('User Contributed') as any;
  let sourceId: number;
  if (!sourceRow) {
    const result = db.prepare(`
      INSERT INTO sources (dataset_name, region, collection, license)
      VALUES (?, ?, ?, ?)
    `).run('User Contributed', null, null, 'User Contributed');
    sourceId = Number(result.lastInsertRowid);
  } else {
    sourceId = sourceRow.id;
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO motifs (
        pitch_sequence, rhythm_sequence, interval_profile, length,
        first_pitch, last_pitch, difficulty, descriptor,
        source_id, recognition_score, checksum
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.pitch_sequence.trim(),
      data.rhythm_sequence?.trim() || null,
      intervalProfile,
      length,
      firstPitch,
      lastPitch,
      data.difficulty,
      data.descriptor.trim(),
      sourceId,
      data.recognition_score,
      checksum
    );
    
    return Number(result.lastInsertRowid);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('A motif with this exact pitch sequence already exists');
    }
    throw error;
  }
}

/**
 * Update an existing motif
 */
export function updateMotif(id: number, data: {
  descriptor?: string;
  pitch_sequence?: string;
  rhythm_sequence?: string | null;
  difficulty?: number;
  recognition_score?: number;
}): boolean {
  const db = getDb();
  
  // Check if motif exists
  const existing = db.prepare('SELECT id FROM motifs WHERE id = ?').get(id) as any;
  if (!existing) {
    return false;
  }
  
  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.descriptor !== undefined) {
    updates.push('descriptor = ?');
    values.push(data.descriptor.trim());
  }
  
  if (data.pitch_sequence !== undefined) {
    updates.push('pitch_sequence = ?');
    values.push(data.pitch_sequence.trim());
    
    // Recalculate derived fields
    const notes = data.pitch_sequence.trim().split(/\s+/);
    updates.push('length = ?');
    values.push(notes.length);
    
    updates.push('first_pitch = ?');
    values.push(extractPitchClass(notes[0] || ''));
    
    updates.push('last_pitch = ?');
    values.push(extractPitchClass(notes[notes.length - 1] || ''));
    
    updates.push('interval_profile = ?');
    values.push(calculateIntervalProfile(data.pitch_sequence));
    
    updates.push('checksum = ?');
    values.push(calculateChecksum(data.pitch_sequence));
  }
  
  if (data.rhythm_sequence !== undefined) {
    updates.push('rhythm_sequence = ?');
    values.push(data.rhythm_sequence?.trim() || null);
  }
  
  if (data.difficulty !== undefined) {
    updates.push('difficulty = ?');
    values.push(data.difficulty);
  }
  
  if (data.recognition_score !== undefined) {
    updates.push('recognition_score = ?');
    values.push(data.recognition_score);
  }
  
  if (updates.length === 0) {
    return true; // Nothing to update
  }
  
  values.push(id);
  
  try {
    db.prepare(`
      UPDATE motifs
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return true;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('A motif with this exact pitch sequence already exists');
    }
    throw error;
  }
}

