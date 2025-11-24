#!/usr/bin/env node
/**
 * Musical crossword generator
 * Bridges SQLite motif database to crossword-layout-generator
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const { generateLayout } = require('crossword-layout-generator');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'music_crossword.db');

/**
 * Fetch motifs from database for crossword generation
 */
async function fetchMotifs(options = {}) {
  const {
    minLength = 5,
    maxLength = 10,
    limit = 50,
    difficulty = null,
    minRecognition = 7,  // Only use highly recognizable motifs by default
    preferCurated = true  // Prefer hand-curated themes
  } = options;

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  let query = `
    SELECT 
      id, 
      pitch_sequence, 
      length, 
      descriptor,
      first_pitch,
      last_pitch,
      difficulty,
      recognition_score
    FROM motifs
    WHERE length >= ? AND length <= ?
  `;
  
  const params = [minLength, maxLength];

  // Filter by recognition score
  if (minRecognition !== null) {
    query += ' AND recognition_score >= ?';
    params.push(minRecognition);
  }

  if (difficulty !== null) {
    query += ' AND difficulty = ?';
    params.push(difficulty);
  }

  // Prefer curated themes, but randomize within that
  if (preferCurated) {
    query += ' ORDER BY recognition_score DESC, RANDOM()';
  } else {
    query += ' ORDER BY RANDOM()';
  }
  
  query += ' LIMIT ?';
  params.push(limit);

  const motifs = await db.all(query, params);
  await db.close();

  return motifs;
}

/**
 * Convert motif to crossword-layout-generator format
 * 
 * The library expects:
 * [
 *   { clue: "...", answer: "WORD", ... },
 *   ...
 * ]
 */
function motifsToEntries(motifs) {
  return motifs.map(motif => {
    // Convert pitch sequence to single-char format for crossword grid
    // Each pitch class becomes one "letter"
    // E.g., "C D E F G" -> "CDEFG"
    const answer = motif.pitch_sequence
      .split(' ')
      .map(normalizePitch)
      .join('');

    return {
      clue: motif.descriptor || `Motif ${motif.id}`,
      answer: answer,
      // Metadata for later retrieval
      motif_id: motif.id,
      original_sequence: motif.pitch_sequence,
      difficulty: motif.difficulty
    };
  });
}

/**
 * Normalize pitch names to single uppercase characters for grid
 * We need a 1-to-1 mapping: 12 pitch classes -> 12 symbols
 * 
 * C, C#, D, D#, E, F, F#, G, G#, A, A#, B
 * ->
 * C, D, E, F, G, H, I, J, K, L, M, N (for sharps we use different letters)
 * 
 * Alternative: Use full pitch names and adjust layout generator
 */
function normalizePitch(pitch) {
  const pitchMap = {
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
  
  return pitchMap[pitch] || pitch[0].toUpperCase();
}

/**
 * Generate a crossword puzzle from motifs
 */
async function generateCrossword(options = {}) {
  const {
    numWords = 10,
    minLength = 5,
    maxLength = 10,
    difficulty = null,
    minRecognition = 7,  // Only iconic themes
    preferCurated = true,
    maxAttempts = 10
  } = options;

  console.log('🎵 Generating musical crossword...');
  console.log(`   Fetching ${numWords} motifs (${minLength}-${maxLength} notes)...`);
  console.log(`   Recognition filter: ${minRecognition}+ (curated: ${preferCurated})`);

  // Fetch motifs from database
  const motifs = await fetchMotifs({
    minLength,
    maxLength,
    limit: numWords * 2, // Fetch extra for better layout options
    difficulty,
    minRecognition,
    preferCurated
  });

  if (motifs.length === 0) {
    throw new Error('No motifs found matching criteria. Try lowering minRecognition or run import_curated_themes.py');
  }

  console.log(`   Found ${motifs.length} candidate motifs`);
  
  // Show recognition score distribution
  const avgRecognition = motifs.reduce((sum, m) => sum + (m.recognition_score || 5), 0) / motifs.length;
  console.log(`   Average recognition score: ${avgRecognition.toFixed(1)}/10`);

  // Convert to crossword entries
  const entries = motifsToEntries(motifs);

  // Try generating layout
  console.log('   Generating layout...');
  
  const layoutResult = generateLayout(entries.slice(0, numWords));

  if (!layoutResult || !layoutResult.table) {
    console.error('❌ Failed to generate layout');
    return null;
  }

  console.log('✅ Crossword generated successfully');
  console.log(`   Grid size: ${layoutResult.rows} x ${layoutResult.cols}`);
  console.log(`   Words placed: ${layoutResult.result.length}`);

  return {
    layout: layoutResult,
    entries: entries.slice(0, numWords),
    metadata: {
      generated_at: new Date().toISOString(),
      difficulty: difficulty,
      grid_size: `${layoutResult.rows}x${layoutResult.cols}`
    }
  };
}

/**
 * Print crossword to console (for testing)
 */
function printCrossword(crossword) {
  if (!crossword) return;

  const { layout } = crossword;
  const { table, rows, cols } = layout;

  console.log('\n📊 Crossword Grid:');
  console.log('─'.repeat(cols * 2 + 1));

  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      const cell = table[r][c];
      row += cell === '-' ? '░' : cell;
      row += ' ';
    }
    console.log(row);
  }

  console.log('─'.repeat(cols * 2 + 1));

  // Print clues
  console.log('\n📝 Clues:');
  layout.result.forEach((entry, idx) => {
    const direction = entry.orientation === 'across' ? '→' : '↓';
    console.log(`${idx + 1}. ${direction} ${entry.clue}`);
  });
}

/**
 * Save crossword to database
 */
async function saveCrossword(crossword) {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  const layoutJson = JSON.stringify(crossword.layout);
  const motifIds = JSON.stringify(
    crossword.entries.map(e => e.motif_id)
  );
  const difficulty = crossword.metadata.difficulty || 1;

  const result = await db.run(`
    INSERT INTO puzzles (layout_json, motif_ids, difficulty)
    VALUES (?, ?, ?)
  `, [layoutJson, motifIds, difficulty]);

  await db.close();

  console.log(`💾 Saved puzzle to database (ID: ${result.lastID})`);
  return result.lastID;
}

/**
 * Main entry point
 */
async function main() {
  try {
    const crossword = await generateCrossword({
      numWords: 10,
      minLength: 5,
      maxLength: 10,
      difficulty: null,
      minRecognition: 7,  // Only highly recognizable themes
      preferCurated: true
    });

    if (crossword) {
      printCrossword(crossword);
      await saveCrossword(crossword);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateCrossword, fetchMotifs, saveCrossword };

