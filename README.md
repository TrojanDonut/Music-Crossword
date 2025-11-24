# Glasbena Križanka (Musical Crossword)

A musical crossword puzzle generator where players fill in melodic motifs instead of words. Solve puzzles by recognizing melodies and entering the correct note sequences.

## 📚 Documentation

**📘 [DOCUMENTATION.md](DOCUMENTATION.md)** - **Complete comprehensive documentation** (all-in-one guide)

Additional resources:
- **[Project Plan](projektni_plan.md)** - Original project plan (Slovenian)
- **[UI README](music-crossword-ui/README.md)** - Web application quick reference
- **[CHANGELOG](music-crossword-ui/CHANGELOG.md)** - Version history

## 🎯 Project Status

**Phase 1 Complete:** Data pipeline and crossword generation prototype

### ✅ Completed (Steps 1 & 2)

- [x] SQLite database schema for motifs, sources, and puzzles
- [x] Humdrum Kern (.krn) parser for Essen Folksong Collection
- [x] ETL pipeline with automatic motif extraction (5-10 notes, crossword-friendly)
- [x] Crossword layout generator integration
- [x] Working prototype that generates musical crosswords

## 🗂️ Project Structure

```
dap-projekt/
├── schema.sql                      # Database schema
├── db_init.py                      # Database initialization
├── krn_parser.py                   # Humdrum Kern file parser
├── etl_essen.py                    # ETL pipeline for Essen collection
├── crossword_generator.js          # Crossword puzzle generator
├── music_crossword.db              # SQLite database (generated)
├── essen-folksong-collection/      # Cloned song corpus
├── curated_themes.json             # 49 iconic melodies
├── import_curated_themes.py        # Import curated themes
├── package.json                    # Node.js dependencies
├── README.md                       # This file
├── QUICKSTART.md                   # Quick start guide
├── UI_IMPLEMENTATION_GUIDE.md      # Detailed UI development guide
├── PITCH_MAPPING_REFERENCE.md      # Note-to-letter mapping explained
└── projektni_plan.md               # Project plan (Slovenian)
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm

### 1. Initialize Database

```bash
python3 db_init.py
```

### 2. Load Curated Themes ⭐ RECOMMENDED

Load 50 hand-picked, **instantly recognizable** themes:
```bash
python3 import_curated_themes.py
# Imports: Star Wars, Jaws, Beethoven, Mozart, Super Mario, etc.
```

**Why this is better**: These are the most famous melodies in the world (recognition score: 7-10/10).  
The Essen collection has random phrase fragments that nobody recognizes.

### 3. (Optional) Load Essen Folk Songs

For additional variety, load folk songs:
```bash
# Test with 50 files
python3 etl_essen.py --limit 50 --min-notes 5 --max-notes 10

# Full German children's songs collection
python3 etl_essen.py --regions europa/deutschl/kinder --min-notes 5 --max-notes 10
```

**Note**: Essen themes get recognition_score=5, curated themes get 7-10.

### 4. Generate Crossword

Install Node.js dependencies:
```bash
npm install
```

Generate a puzzle:
```bash
node crossword_generator.js
# Uses only recognition_score >= 7 by default (curated themes)
```

## 📊 Database Schema

### Core Tables

**`motifs`** - Melodic sequences (5-10 notes)
- `pitch_sequence`: Space-separated pitch classes (e.g., "C D E F G")
- `rhythm_sequence`: Space-separated durations (e.g., "4 4 8 8 2") - Kern notation
- `interval_profile`: Semitone differences (e.g., "+2 +2 +1 +2")
- `length`: Number of notes
- `first_pitch`, `last_pitch`: For layout optimization
- `difficulty`: 1-5 scale
- `descriptor`: Human-readable clue (song title)

**`sources`** - Dataset metadata
- Region, collection, license info

**`puzzles`** - Generated crosswords
- `layout_json`: Full grid and word positions
- `motif_ids`: Which motifs were used

**`tags`** + **`motif_tags`** - Genre/mood filtering

## 🔧 How It Works

### 1. Data Pipeline (Python)

**Parser (`krn_parser.py`)**:
- Reads Humdrum Kern files from Essen collection
- Extracts pitch sequences, metadata (title, genre, key)
- Converts octave-specific pitches to pitch classes (C, D, E, etc.)
- Computes interval profiles for crossword matching

**ETL (`etl_essen.py`)**:
- Scans corpus for `.krn` files
- Extracts **overlapping motifs** of 5-10 notes (like sliding window)
- Normalizes to pitch classes (12-tone chromatic)
- Stores in SQLite with checksum-based deduplication
- Auto-tags by genre (children, folk, etc.)

### 2. Crossword Generator (Node.js)

**Generator (`crossword_generator.js`)**:
- Queries database for random motifs (filtered by length/difficulty)
- Converts pitch sequences to single-char format for grid:
  - Maps 12 pitch classes to letters: C→C, C#→D, D→E, ..., B→N
- Feeds to `crossword-layout-generator` library
- Saves generated puzzle back to database

**Layout Algorithm** (from `crossword-layout-generator`):
- Places words on grid with maximum intersections
- Optimizes for compactness and connectivity
- Returns grid coordinates + clues

## 🎵 Musical Representation

### Pitch Mapping

Songs are normalized to **pitch classes** (ignoring octave):

```
Original Kern:  4f 8a 4.cc 8a ...
Parsed notes:   F(3) A(3) C(4) A(3) ...
Pitch classes:  F A C A ...
Rhythms:        4 8 4. 8 ...
```

The rhythm information (4 = quarter note, 8 = eighth note, etc.) is preserved for natural-sounding melody playback. See [RHYTHM_GUIDE.md](RHYTHM_GUIDE.md) for details.

### Crossword Grid Encoding

For the crossword grid, each pitch class becomes one "cell":

```
Pitch sequence: C D E F G
Grid encoding:  CEFHJ  (using our pitch→letter map)
```

**Complete Pitch → Letter Mapping:**
```
C  → C       F  → H       A  → L
C# → D       F# → I       A# → M
D  → E       G  → J       B  → N
D# → F       G# → K
E  → G
```

This allows the standard crossword algorithm to find intersections where melodies share notes.  
**Example:** If you see "J" in the grid, it represents the note **G**.

## 📈 Current Data

### Curated Themes (⭐ Recommended)
- **49 iconic themes** imported
- Recognition scores: 7-10/10
- Examples: Star Wars, Beethoven's 5th, Jaws, Happy Birthday, Super Mario
- **Everyone will recognize these!**

Distribution by recognition:
- 10/10: 10 themes (Jaws, Star Wars, Happy Birthday, etc.)
- 9/10: 19 themes (Harry Potter, Tetris, Silent Night, etc.)
- 8/10: 13 themes (Blue Danube, Pink Panther, etc.)
- 7/10: 7 themes (Bolero, Swan, etc.)

### Essen Collection (Optional variety)
From initial test run (20 files, 5-10 notes):
- **1,489 motifs** extracted
- Recognition score: 5/10 (random phrases)
- Use for additional variety, but less recognizable

Perfect for crossword-style puzzles! (Standard crosswords average 5-6 letters per word)

## 🎮 Example Generated Puzzle

```
📊 Crossword Grid (17x9):
───────────────────
░ ░ ░ ░ E ░ ░ ░ ░ 
░ ░ ░ ░ M ░ ░ ░ ░ 
░ C G G J J M J C 
░ C N N N L ░ ░ ░ 
...

📝 Clues:
1. → Die Schlangenkoechin 'Oh, where have you been, (motif 28-32)
2. ↓ Muwaschah Lamma Bada (motif 94-101)
...
```

## 🛠️ Next Steps (Phase 3: MVP UI)

### Overview
Build an interactive web application where users can solve musical crossword puzzles.

### Technology Stack
- **Frontend Framework:** SvelteKit (modern, fast, great for interactive UIs)
- **Audio:** Web Audio API for melody playback
- **Database API:** Node.js/Express routes to existing SQLite database
- **Styling:** Responsive design (mobile-first)

### Core Features (Must Have - MVP)

#### 1. Interactive Crossword Grid
- [ ] Display crossword grid from puzzle data
- [ ] Each cell shows current note or remains empty
- [ ] Click cell to activate word/melody (show across/down direction)
- [ ] Highlight active word
- [ ] Handle intersections (one note affects multiple melodies)
- [ ] Visual feedback: empty, filled, correct, incorrect states

#### 2. Note Input UI 🎹
- [ ] 12-button chromatic note picker (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- [ ] Visual keyboard or button grid layout
- [ ] Mobile-friendly touch interface
- [ ] Desktop keyboard shortcuts (C, D, E, F, G, A, B, + Shift for sharps)
- [ ] Clear/backspace functionality

#### 3. Game Logic & Validation
- [ ] Load puzzle from database via API
- [ ] Track user input in grid state
- [ ] Validate answers in real-time or on submit
- [ ] Check if melody is complete and correct
- [ ] Show progress indicator (X/10 melodies solved)
- [ ] Handle intersections properly (shared notes must match)
- [ ] "Check answer" button per word
- [ ] "Reveal answer" option

#### 4. Audio Playback 🔊
- [x] Web Audio API integration ✅
- [x] "Play melody" button for each clue ✅
- [x] Synthesize notes programmatically (triangle waves with ADSR) ✅
- [x] **Rhythm support** - Melodies play with natural timing! ✅
- [x] **Tempo control** - Adjustable speed (60-180 BPM) with presets ✅
- [x] Hint system: ✅
  - [x] Play first note only ✅
  - [x] Play first 3 notes ✅
  - [x] Play full melody ✅

#### 5. Puzzle Selection & Management
- [ ] Home page: list available puzzles
- [ ] Load existing puzzle by ID
- [ ] "Generate new puzzle" button (calls existing generator)
- [ ] Display puzzle metadata (difficulty, grid size, number of melodies)
- [ ] Filter by difficulty (optional)

### Enhanced Features (Should Have)

#### 6. Better Audio Experience
- [ ] Use ADSR envelope for realistic note playback
- [ ] Multiple instrument sounds (piano, strings, etc.)
- [ ] Volume control
- [ ] Mute option

#### 7. User Experience Improvements
- [ ] Progress tracking across sessions (localStorage or database)
- [ ] Timer (optional speedrun mode)
- [ ] Undo/redo functionality
- [ ] Auto-save progress
- [ ] Celebrate completion (animation/sound)

#### 8. Responsive Design
- [ ] Mobile-first CSS
- [ ] Touch-optimized controls
- [ ] Portrait/landscape modes
- [ ] Tablet-friendly layout
- [ ] Desktop keyboard navigation

### Future Enhancements (Could Have)

#### 9. Advanced Features
- [ ] User accounts & authentication
- [ ] Save/load progress across devices
- [ ] Daily puzzle mode
- [ ] Difficulty ratings (1-5 stars)
- [ ] Leaderboards (fastest solves)
- [ ] Social sharing ("I solved today's puzzle!")
- [ ] Custom puzzle creation tool
- [ ] Multiplayer/competitive mode

### Technical Architecture

```
music-crossword-ui/  (SvelteKit project)
├── src/
│   ├── routes/
│   │   ├── +page.svelte              (home: puzzle list)
│   │   ├── puzzle/[id]/
│   │   │   └── +page.svelte          (play puzzle)
│   │   └── api/
│   │       ├── puzzles/+server.js    (GET list, POST generate)
│   │       └── puzzles/[id]/+server.js  (GET specific puzzle)
│   │
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CrosswordGrid.svelte  (main grid component)
│   │   │   ├── ClueList.svelte       (across/down clues)
│   │   │   ├── NotePicker.svelte     (12-tone input UI)
│   │   │   ├── AudioPlayer.svelte    (melody playback)
│   │   │   └── ProgressIndicator.svelte
│   │   │
│   │   ├── stores/
│   │   │   ├── puzzle.js             (current puzzle data)
│   │   │   ├── userInput.js          (grid state)
│   │   │   └── audio.js              (audio context/config)
│   │   │
│   │   └── utils/
│   │       ├── pitchMapping.js       (letter→note conversion)
│   │       ├── audioSynth.js         (Web Audio synthesis)
│   │       └── validation.js         (answer checking)
│   │
│   └── app.css                       (global styles)
│
└── static/
    └── audio/  (optional: pre-generated audio files)
```

### API Endpoints Needed

```javascript
GET  /api/puzzles              // List all puzzles
GET  /api/puzzles/:id          // Get specific puzzle data
POST /api/puzzles/generate     // Generate new puzzle
GET  /api/motifs/:id           // Get motif details
GET  /api/motifs/:id/audio     // Get audio file (if pre-generated)
POST /api/progress             // Save user progress (optional)
```

### Audio Implementation Options

**Option A: Real-time Synthesis (Web Audio API)**
```javascript
const audioContext = new AudioContext();
function playNote(frequency, duration) {
  const oscillator = audioContext.createOscillator();
  oscillator.frequency.value = frequency;
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}
```

**Option B: Pre-generated Audio Files**
- Use Python + `music21` or `midiutil` to generate MIDI/audio for each motif
- Store in `/static/audio/motif_[id].mp3`
- Simpler playback, just `<audio>` elements

### Implementation Roadmap

**Week 1: Foundation**
1. Set up SvelteKit project
2. Create API routes to read from existing SQLite database
3. Build basic grid display (read-only)
4. Add clue list display

**Week 2: Interactivity**
5. Implement note picker UI (12 buttons)
6. Connect input to grid state
7. Add basic validation logic
8. Visual feedback for correct/incorrect

**Week 3: Audio & Polish**
9. Integrate Web Audio API
10. Implement melody playback
11. Add hint system
12. Responsive design

**Week 4: Testing & Enhancement**
13. User testing & bug fixes
14. Performance optimization
15. Add progress tracking
16. Polish UI/UX

### Getting Started Commands

```bash
# 1. Set up SvelteKit project
npm create svelte@latest music-crossword-ui
cd music-crossword-ui
npm install

# 2. Install additional dependencies
npm install better-sqlite3  # For database access

# 3. Copy/link existing database
ln -s ../music_crossword.db ./music_crossword.db

# 4. Start development server
npm run dev
```

### Priority Checklist

**Immediate (MVP Core):**
- [ ] SvelteKit project setup
- [ ] Database API integration
- [ ] Grid display + interaction
- [ ] Note input (12-button picker)
- [ ] Basic validation
- [ ] Simple audio playback

**Short-term (Enhanced MVP):**
- [ ] Better audio (ADSR envelopes)
- [ ] Hint system
- [ ] Progress tracking
- [ ] Responsive design
- [ ] Puzzle selection UI

**Long-term (Future):**
- [ ] User accounts
- [ ] Daily puzzles
- [ ] Leaderboards
- [ ] Social features

## 📚 Data Sources

**Essen Folksong Collection**
- 6,255+ folk melodies from Europe and beyond
- Public domain
- Humdrum Kern format
- https://github.com/ccarh/essen-folksong-collection

**Crossword Generator**
- `crossword-layout-generator` by Michael Wehar
- MIT License
- https://www.npmjs.com/package/crossword-layout-generator

## 🧪 Testing Commands

```bash
# View database contents
sqlite3 music_crossword.db "SELECT COUNT(*) FROM motifs;"
sqlite3 music_crossword.db "SELECT length, COUNT(*) FROM motifs GROUP BY length;"
sqlite3 music_crossword.db "SELECT * FROM motifs LIMIT 5;"

# Parse single file
python3 krn_parser.py

# Generate multiple puzzles
for i in {1..5}; do node crossword_generator.js; done
```

## 📄 License

- Code: MIT License (to be added)
- Essen Folksong Collection: Public Domain / Estate of Helmut Schaffrath
- Generated puzzles inherit source data licenses

## 👥 Authors

Project for DAP course, FRI, University of Ljubljana.

---

**Status**: ✅✅ Phases 1, 2 & 3 Complete! (Data Pipeline + Generator + UI with Rhythm!)  
**Current Database**: 1,538 motifs (49 curated iconic themes + 1,489 folk songs)  
**UI Features**: Interactive grid, rhythm playback, tempo control, hints, auto-save  
**Latest**: 🎵 Rhythm integration complete - melodies sound natural and recognizable!

See:
- UI implementation: [music-crossword-ui/README.md](music-crossword-ui/README.md)
- Rhythm details: [music-crossword-ui/RHYTHM_INTEGRATION.md](music-crossword-ui/RHYTHM_INTEGRATION.md)

