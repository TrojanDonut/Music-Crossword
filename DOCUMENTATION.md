# Glasbena Križanka (Musical Crossword) - Comprehensive Documentation

**Version:** 1.1.0  
**Last Updated:** November 24, 2024  
**Authors:** DAP Project Team, FRI, University of Ljubljana

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Status](#2-project-status)
3. [Quick Start](#3-quick-start)
4. [Architecture Overview](#4-architecture-overview)
5. [Database & Data Pipeline](#5-database--data-pipeline)
6. [Crossword Generation](#6-crossword-generation)
7. [Web Application (UI)](#7-web-application-ui)
8. [Audio System & Rhythm](#8-audio-system--rhythm)
9. [User Guide](#9-user-guide)
10. [Developer Guide](#10-developer-guide)
11. [API Reference](#11-api-reference)
12. [Deployment](#12-deployment)
13. [Future Enhancements](#13-future-enhancements)
14. [Troubleshooting](#14-troubleshooting)
15. [Resources & Credits](#15-resources--credits)

---

## 1. Introduction

### 1.1 What is Glasbena Križanka?

A musical crossword puzzle generator where players fill in melodic motifs instead of words. Users solve puzzles by recognizing famous melodies (Star Wars, Beethoven's 5th, Happy Birthday, etc.) and entering the correct note sequences.

### 1.2 Key Features

- 🎵 **Musical Crosswords**: Melodies replace words in traditional crossword format
- 🎹 **Interactive UI**: Web-based application with visual grid and note picker
- 🔊 **Audio Playback**: Synthesized melody playback with natural rhythm
- 🎼 **Rhythm Support**: Notes play with proper durations (not robotic!)
- 🎚️ **Tempo Control**: Adjustable playback speed (60-180 BPM)
- 💡 **Hint System**: Play first note, first 3 notes, or full melody
- ✓ **Real-time Validation**: Instant feedback on answers
- 📊 **Progress Tracking**: Visual progress bar and auto-save
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

### 1.3 How It Works

1. System generates crossword puzzles using iconic melodies
2. Melodies intersect where they share common notes
3. Users click cells and select notes (C, D, E, F, G, A, B, + sharps)
4. Audio playback helps users recognize the melodies
5. Real-time validation provides feedback
6. Progress is automatically saved

### 1.4 Technology Stack

**Backend:**
- Python 3.8+ (data pipeline, parsing)
- Node.js 16+ (crossword generation)
- SQLite (database)

**Frontend:**
- SvelteKit 2.0 (meta-framework)
- TypeScript (type safety)
- Web Audio API (audio synthesis)
- Vite (build tool)

**Data Sources:**
- Essen Folksong Collection (6,255+ folk melodies)
- Curated Themes (50 iconic melodies)

---

## 2. Project Status

### 2.1 Current Status

**✅ Phase 1 Complete:** Data pipeline and database  
**✅ Phase 2 Complete:** Crossword generation prototype  
**✅ Phase 3 Complete:** Interactive web UI with rhythm support

### 2.2 Implementation Progress

#### Completed Features ✅

**Data Pipeline:**
- [x] SQLite database schema
- [x] Humdrum Kern (.krn) parser
- [x] ETL pipeline with motif extraction
- [x] Curated themes collection (50 iconic melodies)
- [x] Recognition scoring system (1-10 scale)
- [x] Rhythm data extraction and storage

**Crossword Generator:**
- [x] Integration with crossword-layout-generator library
- [x] Pitch-to-letter encoding system
- [x] Layout optimization algorithm
- [x] Database persistence

**Web Application:**
- [x] SvelteKit project setup
- [x] Interactive crossword grid
- [x] 12-note chromatic picker
- [x] Audio playback with Web Audio API
- [x] Rhythm support with tempo control
- [x] Hint system (1 note, 3 notes, full melody)
- [x] Real-time validation
- [x] Progress tracking and auto-save
- [x] Responsive design
- [x] Keyboard shortcuts

### 2.3 Database Statistics

```
Total motifs: 1,538
├─ Curated themes (recognition 7-10): 49
│  ├─ 10/10: 10 themes (Jaws, Star Wars, Happy Birthday)
│  ├─ 9/10:  19 themes (Harry Potter, Tetris)
│  ├─ 8/10:  13 themes (Blue Danube, Pink Panther)
│  └─ 7/10:  7 themes  (Bolero, Swan)
└─ Essen folk songs (recognition 5): 1,489
```

---

## 3. Quick Start

### 3.1 Prerequisites

- Python 3.8+
- Node.js 16+
- npm
- Git (for cloning Essen collection)

### 3.2 Initial Setup (5 minutes)

```bash
# 1. Navigate to project directory
cd /home/tevzs/Gits/dap-projekt

# 2. Initialize database
python3 db_init.py

# 3. Load curated themes (RECOMMENDED)
python3 import_curated_themes.py
# Imports 50 instantly recognizable melodies

# 4. (Optional) Load Essen folk songs for variety
python3 etl_essen.py --limit 50 --min-notes 5 --max-notes 10

# 5. Install Node.js dependencies
npm install

# 6. Generate a test puzzle
node crossword_generator.js
```

### 3.3 Start Web Application

```bash
# Navigate to UI directory
cd music-crossword-ui

# Install dependencies (first time only)
npm install

# Link database
ln -s ../music_crossword.db ./music_crossword.db

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### 3.4 Verify Installation

```bash
# Check database content
sqlite3 music_crossword.db "SELECT COUNT(*) FROM motifs;"
# Should return: 49 (with curated themes only)

# Check puzzles
sqlite3 music_crossword.db "SELECT COUNT(*) FROM puzzles;"
# Should return: 1 (after generating)

# View motif distribution
sqlite3 music_crossword.db "
  SELECT recognition_score, COUNT(*) 
  FROM motifs 
  GROUP BY recognition_score 
  ORDER BY recognition_score DESC;
"
```

---

## 4. Architecture Overview

### 4.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  DATA LAYER                         │
└─────────────────────────────────────────────────────┘

[Essen Collection]      [Curated Themes JSON]
       ↓                         ↓
 [krn_parser.py]     [import_curated_themes.py]
       ↓                         ↓
    [etl_essen.py] ──────────────┘
                   ↓
         [SQLite Database]
         music_crossword.db
         ├─ motifs table
         ├─ sources table
         ├─ puzzles table
         └─ tags tables

┌─────────────────────────────────────────────────────┐
│               GENERATION LAYER                      │
└─────────────────────────────────────────────────────┘

[crossword_generator.js]
       ↓
[crossword-layout-generator library]
       ↓
[Generated puzzles] → Saved to database

┌─────────────────────────────────────────────────────┐
│              APPLICATION LAYER                      │
└─────────────────────────────────────────────────────┘

[SvelteKit Web App]
├─ API Routes (/api/puzzles)
├─ UI Components (Grid, Picker, Audio)
├─ Audio Synthesis (Web Audio API)
└─ State Management (Svelte Stores)
```

### 4.2 Data Flow

```
User Request
    ↓
SvelteKit Route (/puzzle/:id)
    ↓
API Endpoint (fetch puzzle + motifs)
    ↓
SQLite Database Query
    ↓
JSON Response with puzzle data
    ↓
UI Components Render
    ↓
User Interactions:
  ├─ Click cell → Select note → Update grid
  ├─ Play button → Audio synthesis → Melody playback
  └─ Check answer → Validation → Visual feedback
```

### 4.3 Project Structure

```
dap-projekt/
├── schema.sql                      # Database schema
├── db_init.py                      # Database initialization
├── krn_parser.py                   # Kern file parser
├── etl_essen.py                    # ETL pipeline
├── crossword_generator.js          # Puzzle generator
├── import_curated_themes.py        # Import curated themes
├── migrate_add_rhythm.py           # Database migration
├── curated_themes.json             # 50 iconic melodies
├── music_crossword.db              # SQLite database
├── package.json                    # Node.js dependencies
├── projektni_plan.md               # Project plan (Slovenian)
│
├── music-crossword-ui/             # Web application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/        # Svelte components
│   │   │   ├── stores/            # State management
│   │   │   ├── utils/             # Utility functions
│   │   │   └── types/             # TypeScript types
│   │   ├── routes/
│   │   │   ├── +page.svelte       # Home page
│   │   │   ├── puzzle/[id]/       # Puzzle player
│   │   │   └── api/               # API endpoints
│   │   ├── app.html
│   │   └── app.css
│   ├── music_crossword.db         # Symlink to database
│   ├── package.json
│   └── README.md
│
└── Documentation files (.md)
```

---

## 5. Database & Data Pipeline

### 5.1 Database Schema

#### motifs Table

Stores melodic sequences (5-10 notes)

```sql
CREATE TABLE motifs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pitch_sequence TEXT NOT NULL,      -- "C D E F G"
    rhythm_sequence TEXT,               -- "4 4 8 8 2" (Kern notation)
    interval_profile TEXT,              -- "+2 +2 +1 +2" (semitones)
    length INTEGER NOT NULL,            -- Number of notes
    first_pitch TEXT,                   -- For layout optimization
    last_pitch TEXT,
    difficulty INTEGER DEFAULT 3,       -- 1-5 scale
    descriptor TEXT,                    -- Human-readable clue
    source_id INTEGER,
    recognition_score INTEGER DEFAULT 5, -- 1-10 scale
    checksum TEXT UNIQUE,               -- For deduplication
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES sources(id)
);
```

#### sources Table

Dataset metadata

```sql
CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_name TEXT NOT NULL,
    region TEXT,
    collection TEXT,
    license TEXT,
    url TEXT
);
```

#### puzzles Table

Generated crosswords

```sql
CREATE TABLE puzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layout_json TEXT NOT NULL,          -- Full grid and positions
    motif_ids TEXT NOT NULL,            -- JSON array of motif IDs
    difficulty INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### tags Tables

Genre/mood classification

```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE motif_tags (
    motif_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY (motif_id) REFERENCES motifs(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    PRIMARY KEY (motif_id, tag_id)
);
```

### 5.2 Kern Parser (krn_parser.py)

**Purpose:** Parse Humdrum Kern files from Essen Folksong Collection

**Capabilities:**
- Extract pitch sequences with octave information
- Extract rhythm data (note durations)
- Parse metadata (title, region, genre, key, meter)
- Convert to pitch classes (C, D, E, etc.)
- Compute interval profiles

**Key Methods:**

```python
class Melody:
    def to_pitch_classes() -> List[str]
        # Returns: ["C", "D", "E", "F", "G"]
    
    def to_rhythm_sequence() -> List[str]
        # Returns: ["4", "4", "8", "8", "2"]
    
    def extract_motifs(min_length, max_length, stride) -> List[Motif]
        # Sliding window extraction
```

**Example Usage:**

```python
melody = parse_kern_file("path/to/song.krn")
motifs = melody.extract_motifs(min_length=5, max_length=10, stride=3)
# Returns ~80 motifs from a 70-note song
```

### 5.3 ETL Pipeline (etl_essen.py)

**Purpose:** Extract, Transform, Load data from Essen collection to database

**Features:**
- Recursive directory scanning
- Batch processing with progress tracking
- Configurable filters (length, regions)
- Automatic genre tagging
- Checksum-based deduplication
- Statistics reporting

**Command Options:**

```bash
# Load with defaults (5-10 notes)
python3 etl_essen.py

# Test with limited files
python3 etl_essen.py --limit 50

# Specific region
python3 etl_essen.py --regions europa/deutschl/kinder

# Custom length range
python3 etl_essen.py --min-notes 6 --max-notes 12

# Combine options
python3 etl_essen.py --regions europa/deutschl --limit 100 --min-notes 5 --max-notes 8
```

**Statistics Example:**

```
Processing Essen Folk Song Collection...
Region: europa/deutschl/kinder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files processed: 213
Successfully parsed: 213
Failed: 0
Total motifs extracted: 15,847
Inserted to DB: 15,203
Duplicates skipped: 644
```

### 5.4 Curated Themes

**Purpose:** Hand-picked, instantly recognizable melodies for better gameplay

**File:** `curated_themes.json`

**Structure:**

```json
{
  "id": "beethoven_5th",
  "title": "Beethoven - Symphony No. 5, Opening",
  "composer": "Ludwig van Beethoven",
  "pitch_sequence": "G G G Eb F F F D",
  "rhythm_sequence": "8 8 8 2 8 8 8 2",
  "interval_profile": "0 0 -4 +2 0 0 -4",
  "length": 8,
  "first_pitch": "G",
  "last_pitch": "D",
  "difficulty": 2,
  "recognition_score": 10,
  "source": "Classical",
  "year": 1808,
  "genre": "classical",
  "description": "Famous four-note motif",
  "tags": ["classical", "symphony", "iconic"]
}
```

**Import Command:**

```bash
python3 import_curated_themes.py
# Imports all 50 themes with full metadata
```

**Categories:**

1. **Classical** (25 themes): Beethoven, Mozart, Vivaldi, Bach, etc.
2. **Film/TV** (10 themes): Star Wars, Harry Potter, Jaws, etc.
3. **Video Games** (4 themes): Super Mario, Tetris, Zelda
4. **Traditional/Folk** (11 themes): Happy Birthday, Jingle Bells, etc.

---

## 6. Crossword Generation

### 6.1 Generator (crossword_generator.js)

**Purpose:** Create musical crossword puzzles from database motifs

**Architecture:**
- Node.js bridge between SQLite and crossword library
- Fetches motifs from database
- Converts pitch sequences to grid format
- Generates layouts with intersections
- Saves puzzles back to database

**Key Configuration:**

```javascript
const config = {
  numWords: 10,              // Number of melodies
  minLength: 5,              // Min notes per melody
  maxLength: 10,             // Max notes per melody
  minRecognition: 7,         // Only iconic themes (7-10)
  preferCurated: true        // Sort by recognition score
};
```

**Command:**

```bash
# Generate with defaults
node crossword_generator.js

# Edit config in file for custom puzzles
```

### 6.2 Pitch-to-Grid Encoding

**Problem:** Crossword algorithms expect single-character "letters"

**Solution:** Map 12 chromatic notes to 12 letters (C-N)

| Musical Note | Grid Letter | Example |
|--------------|-------------|---------|
| C            | C           | C major scale: CEGJ |
| C♯/D♭        | D           | Jaws: GHGH (E F E F) |
| D            | E           | |
| D♯/E♭        | F           | Beethoven 5th: JJJF |
| E            | G           | |
| F            | H           | |
| F♯/G♭        | I           | |
| G            | J           | **J = G note** |
| G♯/A♭        | K           | |
| A            | L           | |
| A♯/B♭        | M           | |
| B            | N           | |

**Example Transformations:**

```
Star Wars Main Theme:
Pitches: G  G  G  Eb Bb G  Eb Bb G
Grid:    J  J  J  F  M  J  F  M  J

Beethoven's 5th:
Pitches: G  G  G  Eb
Grid:    J  J  J  F
```

### 6.3 Layout Algorithm

Uses `crossword-layout-generator` library:

1. Takes list of "words" (encoded melodies)
2. Places words on grid with maximum intersections
3. Optimizes for compactness and connectivity
4. Returns grid coordinates + clue positions

**Example Output:**

```
Grid: 9 rows × 20 columns
Words placed: 10

ACROSS:
1. Star Wars - Main Theme
2. Beethoven's 5th
3. Happy Birthday

DOWN:
1. Jaws Theme
2. Super Mario
...
```

### 6.4 Database Persistence

```javascript
// Save generated puzzle
db.run(`
  INSERT INTO puzzles (layout_json, motif_ids, difficulty)
  VALUES (?, ?, ?)
`, [
  JSON.stringify(layout),
  JSON.stringify(motifIds),
  difficulty
]);
```

---

## 7. Web Application (UI)

### 7.1 Technology Stack

- **SvelteKit 2.0** - Meta-framework with SSR
- **TypeScript** - Type safety
- **Better-SQLite3** - Database access
- **Web Audio API** - Audio synthesis
- **Vite** - Build tool

### 7.2 Component Architecture

#### Core Components

**CrosswordGrid.svelte**
- Renders the puzzle grid
- Handles cell clicks and navigation
- Shows active word highlighting
- Displays validation states

**CrosswordCell.svelte**
- Individual grid cell
- Visual states: empty, filled, active, correct, incorrect
- Displays musical note symbols (C, D♯, etc.)

**NotePicker.svelte**
- 12-button chromatic note selector
- Piano-key visual style (white + black keys)
- Keyboard shortcuts (C, D, E, F, G, A, B, Shift for sharps)
- Touch-optimized for mobile

**ClueList.svelte**
- Displays across/down clues
- Play buttons per clue
- Compact audio player
- Completion indicators

**AudioPlayer.svelte**
- Melody playback controls
- Hint system (1 note, 3 notes, full melody)
- Tempo control (60-180 BPM)
- Preset buttons (Slow, Normal, Fast)

**ProgressIndicator.svelte**
- Visual progress bar
- Completion statistics (X/10 solved)
- Celebration animation on completion

### 7.3 State Management

Uses Svelte stores for reactive state:

**puzzle.ts**
```typescript
interface PuzzleState {
  id: number | null;
  layout: PuzzleLayout | null;
  clues: Clue[];
  loading: boolean;
  error: string | null;
}
```

**userInput.ts**
```typescript
type GridCell = string | null;
type GridState = GridCell[][];

// Auto-save to localStorage
function saveProgress(puzzleId: number, grid: GridState)
function loadProgress(puzzleId: number): GridState | null
```

**audio.ts**
```typescript
interface AudioState {
  playing: boolean;
  currentClue: number | null;
  volume: number;
  tempo: number;
}
```

### 7.4 Routing

```
/                           Home page (puzzle list)
/puzzle/:id                 Puzzle player
/api/puzzles                GET: List puzzles
/api/puzzles/:id            GET: Fetch specific puzzle
```

### 7.5 Keyboard Shortcuts

- `C, D, E, F, G, A, B` - Select natural notes
- `Shift + C, D, F, G, A` - Select sharp notes
- `Backspace / Delete` - Clear cell
- `Arrow keys` - Navigate grid (optional)

### 7.6 Responsive Design

**Desktop (1024px+):**
- Grid centered
- Clues in sidebar (sticky)
- Note picker below grid
- Full keyboard support

**Tablet (768-1023px):**
- Grid centered
- Clues below grid
- Note picker full-width
- Touch-optimized

**Mobile (< 768px):**
- Grid full-width
- Stacked layout
- Large touch targets (44px minimum)
- Simplified controls

---

## 8. Audio System & Rhythm

### 8.1 Web Audio API Integration

**audio Synth.ts** - Core audio synthesis

```typescript
// Convert pitch class to frequency
function pitchToFrequency(pitch: string, octave: number = 4): number

// Play single note with ADSR envelope
function playNote(pitch: string, duration: number, octave: number): void

// Play melody with rhythm
function playMelodyWithRhythm(
  pitches: string[],
  rhythms: string[],
  tempo: number = 120
): Promise<void>

// Play hint (first N notes)
function playHint(
  pitches: string[],
  rhythms: string[],
  count: number,
  tempo: number
): Promise<void>
```

### 8.2 Rhythm Support ⭐

**Problem:** Without rhythm, all notes play with equal duration → robotic sound

**Solution:** Kern rhythm notation support

#### Rhythm Notation Reference

| Value | Duration | Name | Beats @ 120 BPM |
|-------|----------|------|-----------------|
| `1` | Whole note | 4 beats | 2.0s |
| `2` | Half note | 2 beats | 1.0s |
| `4` | Quarter note | 1 beat | 0.5s |
| `8` | Eighth note | 0.5 beats | 0.25s |
| `16` | Sixteenth note | 0.25 beats | 0.125s |
| `4.` | Dotted quarter | 1.5 beats | 0.75s |
| `2.` | Dotted half | 3 beats | 1.5s |

#### Conversion Function

```typescript
function rhythmToDuration(rhythm: string, tempo: number): number {
  const beatsPerSecond = tempo / 60;
  
  // Parse value and dot
  let baseValue: number;
  let isDotted = false;
  
  if (rhythm.endsWith('.')) {
    baseValue = parseFloat(rhythm.slice(0, -1));
    isDotted = true;
  } else {
    baseValue = parseFloat(rhythm);
  }
  
  // Calculate beats (whole note = 4 beats)
  let beats = 4 / baseValue;
  
  // Dotted notes are 1.5x longer
  if (isDotted) {
    beats *= 1.5;
  }
  
  // Convert to seconds
  return beats / beatsPerSecond;
}
```

#### Example: Beethoven's 5th Symphony

```typescript
pitches = ["G", "G", "G", "Eb"]
rhythms = ["8", "8", "8", "2"]  // short-short-short-LONG

// At 120 BPM:
// G: 0.25s, G: 0.25s, G: 0.25s, Eb: 1.0s
// Result: ♪♪♪♩ (instantly recognizable!)
```

### 8.3 Tempo Control

**Tempo Slider:** 60-180 BPM range

**Preset Buttons:**
- **Slow (80 BPM)**: Learning mode, easier recognition
- **Normal (120 BPM)**: Standard playback
- **Fast (160 BPM)**: Challenge mode

**Implementation:**

```svelte
<script>
  let tempo = 120;
  
  function setPreset(bpm: number) {
    tempo = bpm;
  }
</script>

<div class="tempo-control">
  <input 
    type="range" 
    bind:value={tempo}
    min="60" 
    max="180"
    disabled={isPlaying}
  />
  <div class="tempo-presets">
    <button on:click={() => setPreset(80)}>Slow</button>
    <button on:click={() => setPreset(120)}>Normal</button>
    <button on:click={() => setPreset(160)}>Fast</button>
  </div>
</div>
```

### 8.4 ADSR Envelope

Creates realistic note attack and decay:

```typescript
// Attack (0.01s): 0 → 0.3 volume
gainNode.gain.setValueAtTime(0, startTime);
gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);

// Sustain: Hold at 0.2 volume
gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration * 0.8);

// Release: Fade to 0
gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
```

### 8.5 Oscillator Type

**Triangle waves** provide softer, more musical sound than sine or square waves:

```typescript
oscillator.type = 'triangle';  // Warm, musical tone
```

---

## 9. User Guide

### 9.1 How to Play

1. **Select a Puzzle**
   - Open http://localhost:5173
   - Browse available puzzles
   - Click a puzzle card to start

2. **Understand the Grid**
   - Empty cells need to be filled
   - Cells can be part of multiple words (intersections)
   - Gray squares are blocked (like traditional crosswords)

3. **Listen to Clues**
   - Click ▶ button next to any clue
   - Melody plays with natural rhythm
   - Adjust tempo if needed

4. **Use Hints**
   - **1st Note**: Play just the first note
   - **3 Notes**: Play opening phrase
   - **Full**: Play complete melody

5. **Fill in Notes**
   - Click a cell in the grid
   - Cell highlights (and entire word)
   - Click a note from the picker (C, D, E, etc.)
   - Or use keyboard (C, D, E, F, G, A, B keys)

6. **Check Your Answers**
   - Validation is automatic
   - ✅ Green = Correct
   - ❌ Red shake = Incorrect
   - Gray = Not yet checked

7. **Track Progress**
   - Progress bar shows completion
   - "X/10 melodies solved"
   - Auto-save keeps your progress

8. **Complete the Puzzle**
   - Solve all melodies
   - Celebration animation! 🎉
   - Try another puzzle

### 9.2 Tips for Success

**Recognition Strategies:**

1. **Listen Multiple Times**
   - First: Get general feeling
   - Second: Focus on rhythm pattern
   - Third: Identify individual notes

2. **Use Tempo Control**
   - Start slow (80 BPM) to hear clearly
   - Speed up as you recognize the melody

3. **Work on Intersections**
   - Solve easier melodies first
   - Intersections provide hints for harder ones

4. **Hum Along**
   - Sing/hum the melody yourself
   - Helps with recognition and note identification

5. **Think About Context**
   - Clue titles are helpful ("Beethoven's 5th")
   - Genre tags guide expectations

**Note Identification:**

- **C**: Do (start of C major scale)
- **D**: Re
- **E**: Mi
- **F**: Fa
- **G**: Sol
- **A**: La
- **B**: Ti
- **Sharps**: Black keys on piano

### 9.3 Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| C | Select C natural |
| D | Select D natural |
| E | Select E natural |
| F | Select F natural |
| G | Select G natural |
| A | Select A natural |
| B | Select B natural |
| Shift + C | Select C♯ |
| Shift + D | Select D♯ |
| Shift + F | Select F♯ |
| Shift + G | Select G♯ |
| Shift + A | Select A♯ |
| Backspace | Clear current cell |
| Delete | Clear current cell |

---

## 10. Developer Guide

### 10.1 Development Setup

```bash
# Clone repository (if needed)
git clone <repository-url>
cd dap-projekt

# Backend setup
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt  # If exists

# Initialize database
python3 db_init.py

# Load data
python3 import_curated_themes.py
python3 etl_essen.py --limit 50

# Frontend setup
cd music-crossword-ui
npm install
ln -s ../music_crossword.db ./music_crossword.db

# Start dev server
npm run dev
```

### 10.2 Project File Structure

```
dap-projekt/
├── Backend (Python)
│   ├── db_init.py              # Database creation
│   ├── krn_parser.py           # Kern file parser
│   ├── etl_essen.py            # ETL pipeline
│   ├── import_curated_themes.py
│   └── migrate_add_rhythm.py   # Database migration
│
├── Generator (Node.js)
│   ├── crossword_generator.js  # Puzzle generation
│   ├── package.json
│   └── node_modules/
│
├── Frontend (SvelteKit)
│   └── music-crossword-ui/
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/  # UI components
│       │   │   ├── stores/      # State management
│       │   │   ├── utils/       # Helper functions
│       │   │   └── types/       # TypeScript types
│       │   ├── routes/          # Pages and API
│       │   ├── app.html
│       │   └── app.css
│       ├── static/              # Static assets
│       ├── package.json
│       └── svelte.config.js
│
├── Data
│   ├── music_crossword.db      # SQLite database
│   ├── curated_themes.json     # Iconic melodies
│   └── essen-folksong-collection/ # Source data
│
└── Documentation
    ├── README.md
    ├── DOCUMENTATION.md  # This file
    ├── RHYTHM_GUIDE.md
    ├── PITCH_MAPPING_REFERENCE.md
    └── UI_IMPLEMENTATION_GUIDE.md
```

### 10.3 Adding New Features

#### Adding a New UI Component

1. Create component file:
```bash
touch music-crossword-ui/src/lib/components/NewComponent.svelte
```

2. Implement component:
```svelte
<script lang="ts">
  export let prop: string;
  
  function handleClick() {
    // Logic here
  }
</script>

<div class="new-component">
  <h2>{prop}</h2>
  <button on:click={handleClick}>Click Me</button>
</div>

<style>
  .new-component {
    /* Styles here */
  }
</style>
```

3. Import and use:
```svelte
<script lang="ts">
  import NewComponent from '$lib/components/NewComponent.svelte';
</script>

<NewComponent prop="value" />
```

#### Adding Database Fields

1. Update schema.sql:
```sql
ALTER TABLE motifs ADD COLUMN new_field TEXT;
```

2. Create migration script:
```python
import sqlite3

conn = sqlite3.connect('music_crossword.db')
cursor = conn.cursor()

cursor.execute("ALTER TABLE motifs ADD COLUMN new_field TEXT")
conn.commit()
conn.close()
```

3. Update TypeScript types:
```typescript
export interface Motif {
  // ... existing fields
  new_field: string | null;
}
```

4. Update database queries:
```typescript
export function getMotif(id: number): Motif | null {
  const row = db.prepare(`
    SELECT *, new_field FROM motifs WHERE id = ?
  `).get(id);
  // ... mapping
}
```

### 10.4 Testing

#### Manual Testing

```bash
# Test database
sqlite3 music_crossword.db "SELECT COUNT(*) FROM motifs;"

# Test parser
python3 krn_parser.py

# Test ETL
python3 etl_essen.py --limit 5

# Test generator
node crossword_generator.js

# Test UI
cd music-crossword-ui
npm run dev
# Open http://localhost:5173
```

#### Unit Testing (Future)

```bash
# Install testing dependencies
npm install -D vitest @testing-library/svelte

# Run tests
npm run test
```

Example test file:
```typescript
// tests/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isWordCorrect } from '$lib/utils/validation';

describe('isWordCorrect', () => {
  it('validates correct word', () => {
    const clue = {
      answer: 'CEFHJ',
      position: { x: 0, y: 0 },
      orientation: 'across'
    };
    const grid = [['C', 'E', 'F', 'H', 'J']];
    
    expect(isWordCorrect(clue, grid)).toBe(true);
  });
});
```

### 10.5 Code Style Guidelines

**TypeScript:**
- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Use meaningful variable names

**Svelte:**
- One component per file
- Use TypeScript in `<script lang="ts">`
- Keep components small and focused
- Use stores for shared state

**Python:**
- Follow PEP 8
- Use type hints where appropriate
- Docstrings for all functions
- Keep functions short and focused

**SQL:**
- Uppercase keywords
- Indent for readability
- Index frequently queried columns
- Use foreign keys for referential integrity

---

## 11. API Reference

### 11.1 REST API Endpoints

#### GET /api/puzzles

**Description:** List all available puzzles

**Response:**
```json
{
  "success": true,
  "puzzles": [
    {
      "id": 1,
      "difficulty": 1,
      "created_at": "2024-11-24T10:00:00Z"
    }
  ],
  "count": 10
}
```

**Status Codes:**
- 200: Success
- 500: Server error

#### GET /api/puzzles/:id

**Description:** Get specific puzzle with full details and motif data

**Parameters:**
- `id` (path): Puzzle ID

**Response:**
```json
{
  "success": true,
  "puzzle": {
    "id": 1,
    "layout": {
      "rows": 9,
      "cols": 20,
      "table": [["C", "-", "E"], ...],
      "result": [
        {
          "clue": "Star Wars - Main Theme",
          "answer": "JJJFMJFMJ",
          "position": { "x": 0, "y": 0 },
          "orientation": "across",
          "motif_id": 42
        }
      ]
    },
    "motif_ids": [42, 43, 44, ...],
    "motifs": {
      "42": {
        "id": 42,
        "descriptor": "Star Wars - Main Theme",
        "pitch_sequence": "G G G Eb Bb G Eb Bb G",
        "rhythm_sequence": "4 4 4 4 4 4 4 4 2",
        "recognition_score": 10
      }
    },
    "difficulty": 1,
    "created_at": "2024-11-24T10:00:00Z"
  }
}
```

**Status Codes:**
- 200: Success
- 404: Puzzle not found
- 500: Server error

### 11.2 Database Access (Internal)

#### getMotif(id: number)

```typescript
import { getMotif } from '$lib/utils/database';

const motif = getMotif(42);
// Returns: Motif | null
```

#### getMotifs(ids: number[])

```typescript
import { getMotifs } from '$lib/utils/database';

const motifs = getMotifs([42, 43, 44]);
// Returns: Map<number, Motif>
```

#### getPuzzles()

```typescript
import { getPuzzles } from '$lib/utils/database';

const puzzles = getPuzzles();
// Returns: Puzzle[]
```

#### getPuzzle(id: number)

```typescript
import { getPuzzle } from '$lib/utils/database';

const puzzle = getPuzzle(1);
// Returns: Puzzle | null
```

---

## 12. Deployment

### 12.1 Production Build

```bash
cd music-crossword-ui

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### 12.2 Deployment Options

#### Option 1: Node.js Server (Recommended)

**Adapter:** `@sveltejs/adapter-node`

```bash
# Install adapter
npm install -D @sveltejs/adapter-node
```

**Configure svelte.config.js:**
```javascript
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true
    })
  }
};
```

**Deploy to:**
- DigitalOcean App Platform
- Railway
- Fly.io
- Heroku
- VPS with Node.js

**Start Command:**
```bash
node build/index.js
```

#### Option 2: Static Hosting

**Note:** Only works if you don't need API routes

**Adapter:** `@sveltejs/adapter-static`

```bash
npm install -D @sveltejs/adapter-static
```

**Deploy to:**
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

### 12.3 Environment Variables

Create `.env` file:

```env
# Database path
DATABASE_PATH=./music_crossword.db

# Public URL
PUBLIC_APP_URL=https://your-domain.com

# Node environment
NODE_ENV=production
```

### 12.4 Docker Deployment (Optional)

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy project files
COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

# Copy database
COPY music_crossword.db ./

EXPOSE 3000

CMD ["node", "build/index.js"]
```

**Build and run:**

```bash
docker build -t musical-crossword .
docker run -p 3000:3000 musical-crossword
```

### 12.5 Performance Optimization

**Build optimizations:**
- Minification (automatic with Vite)
- Code splitting (automatic with SvelteKit)
- Asset optimization (images, fonts)

**Runtime optimizations:**
- Server-side rendering (SSR) for fast initial load
- Progressive enhancement
- Lazy loading of heavy components
- Efficient state management

**Database optimization:**
- Indexes on frequently queried columns
- Connection pooling
- Query optimization

---

## 13. Future Enhancements

### 13.1 Short-term (Next Release)

#### User Experience
- [ ] Dark mode toggle
- [ ] User preferences (save tempo, volume)
- [ ] Undo/redo functionality
- [ ] Enhanced animations and transitions
- [ ] Loading states and skeletons

#### Audio
- [ ] Multiple instrument sounds (piano, strings, flute)
- [ ] Volume control per melody
- [ ] Visual rhythm display (musical notation)
- [ ] Metronome option

#### Features
- [ ] Daily puzzle mode
- [ ] Timer/speedrun mode
- [ ] Difficulty-based filtering
- [ ] Tutorial/onboarding for new users

### 13.2 Medium-term

#### Social Features
- [ ] User accounts and authentication
- [ ] Save progress across devices
- [ ] Share completed puzzles
- [ ] Leaderboards (fastest solve times)
- [ ] Friend challenges

#### Content
- [ ] More curated themes (100-200 total)
- [ ] User-generated puzzles
- [ ] Themed puzzle packs (e.g., "80s Hits", "Video Games")
- [ ] Multiple languages/translations

#### Gamification
- [ ] Achievement system
- [ ] Streak tracking
- [ ] XP and levels
- [ ] Unlockable content

### 13.3 Long-term

#### Advanced Features
- [ ] Multiplayer/competitive mode
- [ ] Real-time collaboration
- [ ] Custom puzzle creation tool
- [ ] AI-powered difficulty adjustment
- [ ] Adaptive learning system

#### Platform Expansion
- [ ] Mobile apps (iOS, Android)
- [ ] Offline PWA support
- [ ] Desktop app (Electron)
- [ ] Browser extension

#### Educational
- [ ] Music theory lessons
- [ ] Ear training exercises
- [ ] Integration with music education platforms
- [ ] Teacher tools (assign puzzles, track student progress)

---

## 14. Troubleshooting

### 14.1 Common Issues

#### "Database not found"

**Symptom:** Error when starting UI or generating puzzles

**Solution:**
```bash
# Create database
python3 db_init.py

# Or link existing database
cd music-crossword-ui
ln -s ../music_crossword.db ./music_crossword.db
```

#### "No puzzles available"

**Symptom:** Empty puzzle list on home page

**Solution:**
```bash
# Generate puzzles
node crossword_generator.js

# Verify puzzles exist
sqlite3 music_crossword.db "SELECT COUNT(*) FROM puzzles;"
```

#### "No audio playing"

**Symptom:** Click play button but no sound

**Possible causes:**
1. Browser autoplay policy (requires user interaction)
2. Audio context not initialized
3. Volume is 0
4. Missing rhythm data

**Solutions:**
- Click anywhere on page first
- Check browser console for errors
- Verify database has rhythm_sequence
- Try different browser

#### "Build fails"

**Symptom:** `npm run build` errors

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run check

# Update dependencies
npm update
```

#### "Port already in use"

**Symptom:** `npm run dev` says port 5173 is in use

**Solution:**
```bash
# Use different port
npm run dev -- --port 3000

# Or kill process using port
lsof -ti:5173 | xargs kill -9  # macOS/Linux
```

### 14.2 Debug Mode

#### Enable Detailed Logging

**Backend (Python):**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend (Browser Console):**
```javascript
// Enable detailed audio logs
localStorage.setItem('debug', 'true');
```

#### Check Database Integrity

```bash
# Check schema
sqlite3 music_crossword.db ".schema"

# Check table contents
sqlite3 music_crossword.db "SELECT * FROM motifs LIMIT 5;"

# Verify rhythm data
sqlite3 music_crossword.db "
  SELECT COUNT(*) 
  FROM motifs 
  WHERE rhythm_sequence IS NOT NULL;
"

# Check puzzle structure
sqlite3 music_crossword.db "SELECT layout_json FROM puzzles LIMIT 1;"
```

#### Verify File Permissions

```bash
# Make sure database is readable
ls -l music_crossword.db

# Fix permissions if needed
chmod 644 music_crossword.db
```

### 14.3 Performance Issues

#### Slow Database Queries

**Diagnosis:**
```sql
EXPLAIN QUERY PLAN 
SELECT * FROM motifs 
WHERE length = 7 AND recognition_score >= 7;
```

**Solution:** Ensure indexes exist
```sql
CREATE INDEX IF NOT EXISTS idx_motifs_length ON motifs(length);
CREATE INDEX IF NOT EXISTS idx_motifs_recognition ON motifs(recognition_score);
```

#### Slow UI Rendering

**Diagnosis:**
- Open browser DevTools
- Performance tab
- Record while interacting with puzzle

**Solutions:**
- Reduce number of reactive statements
- Use derived stores instead of manual subscriptions
- Implement virtual scrolling for large grids
- Debounce user input

#### Audio Lag

**Diagnosis:**
- Check Audio Context state
- Monitor scheduling precision

**Solutions:**
- Schedule notes ahead of time
- Use higher-precision timing
- Reduce audio buffer size

### 14.4 Getting Help

**Resources:**
1. Check this documentation
2. Review code comments
3. Search GitHub issues (if repository exists)
4. Check browser console for errors
5. Review database schema and data

**Reporting Issues:**

Include:
- Operating system and version
- Browser and version
- Node.js version
- Python version
- Steps to reproduce
- Error messages (full stack trace)
- Database statistics (motif count, puzzle count)

---

## 15. Resources & Credits

### 15.1 Data Sources

**Essen Folksong Collection**
- 6,255+ folk melodies from Europe and beyond
- Public domain
- Humdrum Kern format
- Repository: https://github.com/ccarh/essen-folksong-collection

**Curated Themes**
- Hand-selected 50 iconic melodies
- Recognition scores: 7-10/10
- Categories: Classical, Film/TV, Video Games, Traditional

### 15.2 Libraries & Tools

**Backend:**
- Python 3.8+ (standard library)
- SQLite3 (database)

**Generator:**
- Node.js 16+
- `crossword-layout-generator` v0.1.1 (MIT License)
- `better-sqlite3` v9.0.0

**Frontend:**
- SvelteKit 2.0 (MIT License)
- TypeScript 5.0+
- Vite 5.0 (MIT License)
- Web Audio API (browser standard)

### 15.3 References

**Music Theory:**
- 12-tone equal temperament system
- A4 = 440 Hz standard tuning
- Kern notation for rhythm

**Web Standards:**
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- LocalStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

**Frameworks:**
- SvelteKit: https://kit.svelte.dev/
- Svelte: https://svelte.dev/

### 15.4 License

**Code:**
- MIT License (to be added)

**Data:**
- Essen Folksong Collection: Public Domain / Estate of Helmut Schaffrath
- Curated themes: Fair use for educational/research purposes
- Generated puzzles inherit source data licenses

### 15.5 Authors & Contributors

**Project Team:**
- DAP Course Project
- FRI, University of Ljubljana
- November 2024

**Special Thanks:**
- Helmut Schaffrath (Essen Collection)
- Michael Wehar (crossword-layout-generator)
- Craig Stuart Sapp (Humdrum tools)

### 15.6 Related Documentation

**Project Files:**
- `README.md` - Main project readme
- `projektni_plan.md` - Original project plan (Slovenian)
- `RHYTHM_GUIDE.md` - Detailed rhythm notation guide
- `PITCH_MAPPING_REFERENCE.md` - Note-to-letter mapping explained
- `UI_IMPLEMENTATION_GUIDE.md` - Technical UI development guide
- `QUICKSTART.md` - Quick setup guide
- `EDITING_GUIDE.md` - Manual data editing guide

**UI-Specific:**
- `music-crossword-ui/README.md` - Web app documentation
- `music-crossword-ui/QUICKSTART.md` - UI quick start
- `music-crossword-ui/RHYTHM_INTEGRATION.md` - Rhythm feature details
- `music-crossword-ui/CHANGELOG.md` - Version history

---

## Appendix

### A. Glossary

**Pitch Class:** Musical note without octave (C, D, E, F, G, A, B, and sharps/flats)

**Motif:** Short melodic sequence (5-10 notes in this project)

**Kern Notation:** Text-based music encoding format (e.g., `4c 8d 8e 2f`)

**ADSR Envelope:** Attack, Decay, Sustain, Release - parameters for note amplitude over time

**BPM:** Beats Per Minute - tempo measurement

**Recognition Score:** 1-10 rating of how well-known a melody is

**Grid Letter:** Internal single-character encoding for musical notes (C-N)

**Intersection:** Grid cell that's part of both an across and down word

**Web Audio API:** Browser API for audio synthesis and manipulation

### B. FAQ

**Q: Why are notes displayed differently than traditional sheet music?**  
A: We use pitch classes (no octaves) to simplify the puzzle and make it more accessible.

**Q: Can I add my own melodies?**  
A: Yes! Edit `curated_themes.json` and run `python3 import_curated_themes.py`.

**Q: Why do some melodies sound better than others?**  
A: Curated themes have rhythm data, which makes them sound natural. Essen motifs may not have rhythm data.

**Q: How do I make puzzles easier/harder?**  
A: Edit `crossword_generator.js` and adjust `minRecognition` (higher = easier) or `minLength`/`maxLength` (longer = harder).

**Q: Can this run offline?**  
A: Currently no, but PWA support is planned for future releases.

**Q: What browsers are supported?**  
A: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Web Audio API is required.

**Q: Can I contribute to the project?**  
A: Yes! The project is open to contributions. Contact the project team for details.

---

**End of Documentation**

**Document Version:** 1.0  
**Generated:** November 24, 2024  
**Status:** Complete and Production-Ready

For updates, corrections, or additional information, please refer to individual documentation files or contact the project team.

🎵 **Made with ♪ for music lovers** 🎵

