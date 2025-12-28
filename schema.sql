-- SQLite schema for music motif crossword database
-- Design follows projektni_plan.md requirements

-- Main motifs table: one row per melodic motif
CREATE TABLE IF NOT EXISTS motifs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Core musical data
    pitch_sequence TEXT NOT NULL,          -- Space-separated pitches with octaves: "C4 D4 E4 F#4" (2 octaves: C4-C5)
    rhythm_sequence TEXT,                   -- Space-separated durations (Kern notation): "4 4 8 8 2" (quarter, quarter, eighth, eighth, half)
    interval_profile TEXT,                  -- Derived interval vector for fast crossing validation: "+2 +2 +2 -1"
    length INTEGER NOT NULL,                -- Number of notes in the sequence
    
    -- Transposition & compatibility
    allowed_transpositions TEXT DEFAULT '*', -- JSON array of allowed semitone shifts: "[0, 2, 5]" or "*" for all
    first_pitch TEXT,                       -- Starting pitch class for layout hints
    last_pitch TEXT,                        -- Ending pitch class for layout hints
    
    -- Metadata & sourcing
    source_id INTEGER NOT NULL,             -- FK to sources table
    original_filename TEXT,                 -- e.g. "deut0001.krn"
    descriptor TEXT,                        -- Human-readable clue/title: "Alle meine Entchen"
    license TEXT DEFAULT 'Public Domain',   
    difficulty INTEGER DEFAULT 1,           -- 1-5 scale, derived from length/interval complexity
    recognition_score INTEGER DEFAULT 5,    -- 1-10 scale: how recognizable is this motif? 10=everyone knows it
    
    -- Audio preview
    audio_preview TEXT,                     -- Path to generated MIDI/OGG preview file
    
    -- Indexing & validation
    checksum TEXT UNIQUE,                   -- SHA256 of normalized pitch_sequence to detect duplicates
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- Source datasets table
CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,              -- e.g. "Essen Folksong - Deutschland/Fink"
    region TEXT,                            -- e.g. "Deutschland", "polska", "italia"
    collection TEXT,                        -- e.g. "fink", "erk1", "boehme"
    license TEXT DEFAULT 'Public Domain',
    url TEXT,                               -- Original repo/dataset URL
    notes TEXT,                             -- Free-form metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags for filtering and categorization
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,              -- e.g. "children", "christmas", "folk", "major", "minor"
    category TEXT                           -- e.g. "genre", "tonality", "mood", "difficulty"
);

-- Many-to-many: motifs ↔ tags
CREATE TABLE IF NOT EXISTS motif_tags (
    motif_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (motif_id, tag_id),
    FOREIGN KEY (motif_id) REFERENCES motifs(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Generated crossword puzzles (for caching and progress tracking)
CREATE TABLE IF NOT EXISTS puzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layout_json TEXT NOT NULL,              -- JSON: crossword-layout output with grid coordinates
    motif_ids TEXT NOT NULL,                -- JSON array of motif IDs used in this puzzle
    difficulty INTEGER DEFAULT 1,           -- 1-5 derived from motif difficulties
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking (optional for MVP, prepared for future)
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    puzzle_id INTEGER NOT NULL,
    user_id TEXT,                           -- Session ID or user identifier
    state_json TEXT,                        -- JSON: current grid state with filled notes
    completed BOOLEAN DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_motifs_length ON motifs(length);
CREATE INDEX IF NOT EXISTS idx_motifs_source ON motifs(source_id);
CREATE INDEX IF NOT EXISTS idx_motifs_difficulty ON motifs(difficulty);
CREATE INDEX IF NOT EXISTS idx_motifs_recognition ON motifs(recognition_score);
CREATE INDEX IF NOT EXISTS idx_motifs_first_pitch ON motifs(first_pitch);
CREATE INDEX IF NOT EXISTS idx_motifs_last_pitch ON motifs(last_pitch);
CREATE INDEX IF NOT EXISTS idx_sources_region ON sources(region);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);

