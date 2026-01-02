#!/usr/bin/env node
/**
 * Generate multiple crosswords with different difficulty levels
 * - 3 EASY crosswords (using the 50 new recognizable songs)
 * - 1 HARD crossword (using the original Essen collection)
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { generateLayout } = require('crossword-layout-generator');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'music_crossword.db');
const OUTPUT_DIR = join(__dirname, 'generated_crosswords');

/**
 * Fetch motifs from database for crossword generation
 */
async function fetchMotifs(options = {}) {
  const {
    minLength = 5,
    maxLength = 12,
    limit = 50,
    difficulty = null,
    minRecognition = null,
    sourceId = null,
    excludeMotifIds = []
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
      recognition_score,
      source_id
    FROM motifs
    WHERE length >= ? AND length <= ?
  `;
  
  const params = [minLength, maxLength];

  // Filter by source_id (for the 50 curated songs)
  if (sourceId !== null) {
    query += ' AND source_id = ?';
    params.push(sourceId);
  }

  // Filter by difficulty
  if (difficulty !== null) {
    query += ' AND difficulty = ?';
    params.push(difficulty);
  }

  // Filter by recognition score
  if (minRecognition !== null) {
    query += ' AND recognition_score >= ?';
    params.push(minRecognition);
  }

  // Exclude specific motif IDs
  if (excludeMotifIds.length > 0) {
    query += ` AND id NOT IN (${excludeMotifIds.map(() => '?').join(',')})`;
    params.push(...excludeMotifIds);
  }

  query += ' ORDER BY recognition_score DESC, RANDOM()';
  query += ' LIMIT ?';
  params.push(limit);

  const motifs = await db.all(query, params);
  await db.close();

  return motifs;
}

/**
 * Normalize pitch names to single uppercase characters for grid
 */
function normalizePitch(pitch) {
  // Extract pitch class from note with octave (e.g., "C4" -> "C", "D#5" -> "D#")
  const pitchClass = pitch.replace(/\d+$/, ''); // Remove trailing digits
  
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
  
  return pitchMap[pitchClass] || pitchClass[0].toUpperCase();
}

/**
 * Convert motif to crossword-layout-generator format
 */
function motifsToEntries(motifs) {
  return motifs.map(motif => {
    const answer = motif.pitch_sequence
      .split(' ')
      .map(normalizePitch)
      .join('');

    return {
      clue: motif.descriptor || `Motif ${motif.id}`,
      answer: answer,
      motif_id: motif.id,
      original_sequence: motif.pitch_sequence,
      difficulty: motif.difficulty,
      recognition_score: motif.recognition_score
    };
  });
}

/**
 * Generate a single crossword puzzle
 */
async function generateCrossword(options = {}) {
  const {
    numWords = 10,
    minLength = 5,
    maxLength = 12,
    difficulty = null,
    minRecognition = null,
    sourceId = null,
    excludeMotifIds = [],
    label = 'crossword'
  } = options;

  const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 5 ? 'HARD' : 'MEDIUM';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎵 Generating ${diffLabel} crossword (${label})...`);
  console.log(`   Difficulty level: ${difficulty || 'any'}`);
  console.log(`   Source ID: ${sourceId || 'any'}`);
  if (excludeMotifIds.length > 0) {
    console.log(`   Excluding ${excludeMotifIds.length} previously used motifs`);
  }
  console.log(`   Fetching ${numWords} motifs (${minLength}-${maxLength} notes)...`);

  // Fetch motifs from database
  const motifs = await fetchMotifs({
    minLength,
    maxLength,
    limit: numWords * 3, // Fetch extra for better layout options
    difficulty,
    minRecognition,
    sourceId,
    excludeMotifIds
  });

  if (motifs.length === 0) {
    throw new Error('No motifs found matching criteria.');
  }

  console.log(`   Found ${motifs.length} candidate motifs`);
  
  // Show statistics
  const avgRecognition = motifs.reduce((sum, m) => sum + (m.recognition_score || 5), 0) / motifs.length;
  const avgLength = motifs.reduce((sum, m) => sum + m.length, 0) / motifs.length;
  console.log(`   Average recognition: ${avgRecognition.toFixed(1)}/10`);
  console.log(`   Average length: ${avgLength.toFixed(1)} notes`);

  // Convert to crossword entries
  const entries = motifsToEntries(motifs);

  // Try generating layout
  console.log('   Generating layout...');
  
  let layoutResult = null;
  let attempt = 0;
  const maxAttempts = 5;

  // Try different word counts if layout fails
  for (let wordCount = numWords; wordCount >= Math.max(5, numWords - 3) && !layoutResult; wordCount--) {
    attempt++;
    try {
      layoutResult = generateLayout(entries.slice(0, wordCount));
      if (layoutResult && layoutResult.table) {
        break;
      }
    } catch (e) {
      console.log(`   Attempt ${attempt} with ${wordCount} words failed, trying with fewer...`);
    }
  }

  if (!layoutResult || !layoutResult.table) {
    console.error('   ❌ Failed to generate layout after multiple attempts');
    return null;
  }

  console.log(`   ✅ Layout generated successfully!`);
  console.log(`   Grid size: ${layoutResult.rows} x ${layoutResult.cols}`);
  console.log(`   Words placed: ${layoutResult.result.length}`);

  return {
    layout: layoutResult,
    entries: entries.slice(0, layoutResult.result.length),
    metadata: {
      generated_at: new Date().toISOString(),
      difficulty: difficulty,
      difficulty_label: diffLabel,
      label: label,
      grid_size: `${layoutResult.rows}x${layoutResult.cols}`,
      num_words: layoutResult.result.length,
      avg_recognition: avgRecognition.toFixed(1)
    }
  };
}

/**
 * Print crossword to console
 */
function printCrossword(crossword) {
  if (!crossword) return;

  const { layout, metadata } = crossword;
  const { table, rows, cols, result } = layout;

  console.log(`\n   📊 Crossword Grid (${metadata.grid_size}):`);
  console.log('   ' + '─'.repeat(cols * 2 + 1));

  for (let r = 0; r < rows; r++) {
    let row = '   ';
    for (let c = 0; c < cols; c++) {
      const cell = table[r][c];
      row += cell === '-' ? '░' : cell;
      row += ' ';
    }
    console.log(row);
  }

  console.log('   ' + '─'.repeat(cols * 2 + 1));

  // Print clues
  console.log(`\n   📝 Clues (${result.length} total):`);
  
  const acrossClues = result.filter(e => e.orientation === 'across');
  const downClues = result.filter(e => e.orientation === 'down');
  
  if (acrossClues.length > 0) {
    console.log('\n   ACROSS:');
    acrossClues.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.clue} (${entry.answer.length} notes)`);
    });
  }
  
  if (downClues.length > 0) {
    console.log('\n   DOWN:');
    downClues.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.clue} (${entry.answer.length} notes)`);
    });
  }
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

  const puzzleId = result.lastID;
  console.log(`   💾 Saved to database (Puzzle ID: ${puzzleId})`);
  return puzzleId;
}

/**
 * Save crossword to JSON file
 */
function saveCrosswordToFile(crossword, filename) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filepath = join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(crossword, null, 2));
  console.log(`   📄 Saved to file: ${filepath}`);
  return filepath;
}

/**
 * Main entry point
 */
async function main() {
  console.log('\n🎼 MUSICAL CROSSWORD GENERATOR');
  console.log('   Generating 3 EASY crosswords using the 50 recognizable songs...\n');

  const results = [];
  const usedMotifIds = new Set();

  try {
    // Get the source_id for "Curated Popular Songs"
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    const sourceRow = await db.get('SELECT id FROM sources WHERE name = ?', 'Curated Popular Songs');
    await db.close();
    
    if (!sourceRow) {
      throw new Error('Source "Curated Popular Songs" not found in database. Run import_curated_themes.py first.');
    }
    
    const curatedSourceId = sourceRow.id;
    console.log(`   Using source ID ${curatedSourceId} (Curated Popular Songs)\n`);

    // Generate 3 EASY crosswords with different motifs
    for (let i = 1; i <= 3; i++) {
      // For the third crossword, allow a wider range of lengths since we're running out
      const minLen = i <= 2 ? 7 : 6;
      const maxLen = i <= 2 ? 12 : 15;
      
      const crossword = await generateCrossword({
        numWords: 10,
        minLength: minLen,
        maxLength: maxLen,
        difficulty: 1,  // EASY
        minRecognition: 6,
        sourceId: curatedSourceId,  // Use only the 50 curated songs
        excludeMotifIds: Array.from(usedMotifIds),  // Avoid reusing motifs
        label: `Easy #${i}`
      });

      if (crossword) {
        printCrossword(crossword);
        const puzzleId = await saveCrossword(crossword);
        const filepath = saveCrosswordToFile(crossword, `easy_${i}_puzzle_${puzzleId}.json`);
        results.push({ type: 'EASY', number: i, puzzleId, filepath });
        
        // Track used motifs
        crossword.entries.forEach(entry => usedMotifIds.add(entry.motif_id));
        console.log(`   📌 Now tracking ${usedMotifIds.size} used motifs`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ ALL CROSSWORDS GENERATED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    results.forEach(r => {
      console.log(`   ${r.type} #${r.number}: Puzzle ID ${r.puzzleId}`);
      console.log(`      File: ${r.filepath}`);
    });
    console.log(`\n📁 All crosswords saved to: ${OUTPUT_DIR}/`);
    console.log(`💾 Database: ${DB_PATH}`);
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();

