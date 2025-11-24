# Musical Crossword - UI Implementation Guide

**Phase 3: Interactive Web Application**

This guide provides detailed technical specifications for implementing the SvelteKit frontend for the Musical Crossword Puzzle game.

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Setup](#project-setup)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [API Integration](#api-integration)
7. [Audio Implementation](#audio-implementation)
8. [State Management](#state-management)
9. [Validation Logic](#validation-logic)
10. [Styling Guide](#styling-guide)
11. [Testing Strategy](#testing-strategy)
12. [Deployment](#deployment)

---

## Overview

### What We're Building
An interactive web app where users solve crossword puzzles by filling in melodic sequences instead of words. Each "word" is a famous melody (e.g., Star Wars theme, Beethoven's 5th Symphony) that intersects with other melodies where they share common notes.

### User Flow
1. User lands on home page, sees list of available puzzles
2. User selects a puzzle or generates a new one
3. Puzzle page displays:
   - Crossword grid (empty cells)
   - Clues (melody titles)
   - Note picker (12 chromatic notes)
   - Audio controls (play melody, hints)
4. User clicks a cell → activates a word (melody)
5. User selects notes from the picker → fills in the grid
6. System validates input, shows feedback
7. User completes puzzle → celebration!

---

## Technology Stack

### Frontend
- **SvelteKit 2.0+** - Modern meta-framework for Svelte
- **TypeScript** - Type safety (recommended)
- **Vite** - Build tool (included with SvelteKit)
- **Tailwind CSS** - Utility-first styling (or vanilla CSS)

### Backend API
- **SvelteKit API Routes** - Server-side endpoints
- **better-sqlite3** - Node.js SQLite library
- Existing database: `music_crossword.db`

### Audio
- **Web Audio API** - Native browser audio synthesis
- Optional: **Tone.js** - Higher-level audio library

### Optional Enhancements
- **LocalStorage API** - Save progress locally
- **PWA (Progressive Web App)** - Offline support
- **Vitest** - Unit testing
- **Playwright** - E2E testing

---

## Project Setup

### 1. Initialize SvelteKit Project

```bash
# Navigate to project root
cd /home/tevzs/Gits/dap-projekt

# Create SvelteKit app
npm create svelte@latest music-crossword-ui

# Choose options:
# - Which Svelte app template? → Skeleton project
# - Add type checking with TypeScript? → Yes, using TypeScript syntax
# - Select additional options → ESLint, Prettier
```

### 2. Install Dependencies

```bash
cd music-crossword-ui
npm install

# Add database driver
npm install better-sqlite3

# Optional: Audio library
npm install tone

# Optional: UI library
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Link Existing Database

```bash
# Create symbolic link to existing database
ln -s ../music_crossword.db ./music_crossword.db

# Or copy it
cp ../music_crossword.db ./music_crossword.db
```

### 4. Directory Structure

```
music-crossword-ui/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CrosswordGrid.svelte
│   │   │   ├── CrosswordCell.svelte
│   │   │   ├── ClueList.svelte
│   │   │   ├── NotePicker.svelte
│   │   │   ├── AudioPlayer.svelte
│   │   │   ├── ProgressIndicator.svelte
│   │   │   └── PuzzleCard.svelte
│   │   │
│   │   ├── stores/
│   │   │   ├── puzzle.ts
│   │   │   ├── userInput.ts
│   │   │   └── audio.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── pitchMapping.ts
│   │   │   ├── audioSynth.ts
│   │   │   ├── validation.ts
│   │   │   └── database.ts
│   │   │
│   │   └── types/
│   │       └── puzzle.ts
│   │
│   ├── routes/
│   │   ├── +page.svelte              (home/puzzle list)
│   │   ├── +page.server.ts           (SSR data loading)
│   │   │
│   │   ├── puzzle/
│   │   │   └── [id]/
│   │   │       ├── +page.svelte      (puzzle player)
│   │   │       └── +page.server.ts   (load puzzle data)
│   │   │
│   │   └── api/
│   │       ├── puzzles/
│   │       │   └── +server.ts        (GET list, POST generate)
│   │       │
│   │       └── puzzles/
│   │           └── [id]/
│   │               └── +server.ts    (GET specific puzzle)
│   │
│   ├── app.html
│   └── app.css
│
├── static/
│   ├── favicon.png
│   └── audio/  (optional pre-generated files)
│
├── music_crossword.db  (symlink or copy)
├── svelte.config.js
├── vite.config.ts
└── package.json
```

---

## Component Architecture

### 1. CrosswordGrid.svelte

**Purpose:** Main grid component that displays the crossword puzzle

**Props:**
```typescript
interface Props {
  layout: PuzzleLayout;      // Grid structure from database
  userInput: GridState;      // Current user answers
  activeWord: number | null; // Currently selected clue
  onCellClick: (row: number, col: number) => void;
}
```

**Responsibilities:**
- Render grid cells (empty, filled, highlighted)
- Handle cell clicks
- Show active word highlighting
- Display intersections correctly
- Responsive sizing

**Key Features:**
- CSS Grid layout for responsive design
- Visual states: empty, filled, correct, incorrect, active
- Touch-friendly on mobile

### 2. CrosswordCell.svelte

**Purpose:** Individual cell in the crossword grid

**Props:**
```typescript
interface Props {
  value: string | null;      // Current note (C, D#, etc.) or null
  isActive: boolean;         // Part of active word?
  isCorrect: boolean | null; // Validation state
  isIntersection: boolean;   // Part of multiple words?
  row: number;
  col: number;
  onClick: () => void;
}
```

**Visual States:**
- Empty: Light background
- Filled: Show note letter/symbol
- Active: Blue border/highlight
- Correct: Green background (after validation)
- Incorrect: Red shake animation
- Intersection: Special indicator (small dot)

### 3. NotePicker.svelte

**Purpose:** 12-button chromatic note input

**Layout:**
```
[C] [C#] [D] [D#] [E] [F] [F#] [G] [G#] [A] [A#] [B]
```

**Features:**
- Piano-key visual style (white keys + black keys elevated)
- Keyboard shortcuts: C, D, E, F, G, A, B (Shift for sharps)
- Emit events: `on:noteSelect`
- Highlight selected note
- Clear/backspace button

**Mobile Considerations:**
- Large touch targets (min 44x44px)
- Haptic feedback (if available)
- Swipe gestures (optional)

### 4. ClueList.svelte

**Purpose:** Display across/down clues

**Props:**
```typescript
interface Props {
  clues: Clue[];
  activeClueId: number | null;
  onClueClick: (id: number) => void;
}
```

**Layout:**
```
ACROSS                    DOWN
1. Star Wars Theme        1. Happy Birthday
2. Beethoven's 5th        2. Jaws Theme
...
```

**Features:**
- Click clue → activate that word in grid
- Show completion status (✓ for solved)
- Audio play button per clue
- Hint buttons (play first note, first 3, full melody)

### 5. AudioPlayer.svelte

**Purpose:** Melody playback controls

**Props:**
```typescript
interface Props {
  motif: Motif;  // Contains pitch_sequence
  tempo: number; // BPM (default 120)
}
```

**Features:**
- Play/pause button
- Hint levels:
  - Play first note
  - Play first 3 notes
  - Play full melody
- Speed control (0.5x, 1x, 1.5x, 2x)
- Volume control
- Visualizer (optional: show notes as they play)

### 6. ProgressIndicator.svelte

**Purpose:** Show puzzle completion

**Display:**
```
🎵 Musical Crossword
━━━━━━━━━━━━━━━━━━━━
✅ ✅ ⬜ ✅ ⬜ ⬜ ⬜ ⬜ ⬜ ⬜
3 / 10 melodies solved
```

**Features:**
- Visual progress bar
- Confetti animation on completion
- Time elapsed (optional)
- Streak counter (optional)

---

## Data Flow

### 1. Load Puzzle

```
User navigates to /puzzle/[id]
    ↓
+page.server.ts loads puzzle from database
    ↓
Returns puzzle data to +page.svelte
    ↓
Initialize stores (puzzle, userInput)
    ↓
Render CrosswordGrid + ClueList
```

### 2. User Input Flow

```
User clicks cell in grid
    ↓
Set activeWord (identify which clue)
    ↓
User clicks note in NotePicker
    ↓
Update userInput store
    ↓
Grid re-renders with new value
    ↓
If word complete → validate answer
    ↓
Show feedback (green/red)
```

### 3. Audio Playback Flow

```
User clicks "Play" on clue
    ↓
Load motif pitch_sequence from puzzle data
    ↓
Convert to frequencies (A4 = 440Hz)
    ↓
Use Web Audio API to play notes sequentially
    ↓
Visual feedback (highlight notes as they play)
```

---

## API Integration

### API Endpoints

#### GET /api/puzzles
**Purpose:** List all available puzzles

**Response:**
```json
{
  "puzzles": [
    {
      "id": 1,
      "difficulty": 1,
      "grid_size": "9x20",
      "num_words": 10,
      "created_at": "2024-11-24T10:00:00Z"
    }
  ]
}
```

#### GET /api/puzzles/[id]
**Purpose:** Get specific puzzle data

**Response:**
```json
{
  "puzzle": {
    "id": 1,
    "layout": {
      "rows": 9,
      "cols": 20,
      "table": [["C", "-", "E"], ...],
      "result": [
        {
          "clue": "Star Wars - Main Theme",
          "answer": "JNJGCEFHJ",
          "position": { "x": 0, "y": 0 },
          "orientation": "across",
          "motif_id": 42
        }
      ]
    },
    "difficulty": 1,
    "created_at": "2024-11-24T10:00:00Z"
  }
}
```

#### POST /api/puzzles/generate
**Purpose:** Generate new puzzle

**Request:**
```json
{
  "numWords": 10,
  "difficulty": 1,
  "minRecognition": 7
}
```

**Response:**
```json
{
  "puzzle_id": 5,
  "message": "Puzzle generated successfully"
}
```

### Database Helper (src/lib/utils/database.ts)

```typescript
import Database from 'better-sqlite3';

const db = new Database('./music_crossword.db', { readonly: true });

export function getPuzzles() {
  return db.prepare('SELECT * FROM puzzles ORDER BY created_at DESC').all();
}

export function getPuzzle(id: number) {
  const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(id);
  if (!puzzle) return null;
  
  return {
    id: puzzle.id,
    layout: JSON.parse(puzzle.layout_json),
    motif_ids: JSON.parse(puzzle.motif_ids),
    difficulty: puzzle.difficulty,
    created_at: puzzle.created_at
  };
}

export function getMotif(id: number) {
  return db.prepare('SELECT * FROM motifs WHERE id = ?').get(id);
}
```

---

## Audio Implementation

### Option A: Simple Web Audio API

```typescript
// src/lib/utils/audioSynth.ts

const audioContext = new AudioContext();

// Convert pitch class to frequency (A4 = 440Hz)
function pitchToFrequency(pitch: string, octave: number = 4): number {
  const pitchMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  const semitones = pitchMap[pitch] + (octave - 4) * 12 - 9; // A4 as reference
  return 440 * Math.pow(2, semitones / 12);
}

// Play a single note
export function playNote(
  pitch: string, 
  duration: number = 0.5, 
  octave: number = 4
): void {
  const frequency = pitchToFrequency(pitch, octave);
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = 'sine'; // or 'triangle', 'square', 'sawtooth'
  oscillator.frequency.value = frequency;
  
  // ADSR envelope (simple attack-decay)
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); // Attack
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration); // Decay
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

// Play a melody (sequence of notes)
export async function playMelody(
  pitchSequence: string[], 
  noteDuration: number = 0.4,
  gap: number = 0.05
): Promise<void> {
  for (const pitch of pitchSequence) {
    playNote(pitch, noteDuration);
    await new Promise(resolve => setTimeout(resolve, (noteDuration + gap) * 1000));
  }
}

// Usage in component:
// playMelody(['C', 'D', 'E', 'F', 'G']);
```

### Option B: Tone.js (Richer Sound)

```typescript
import * as Tone from 'tone';

const synth = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }
}).toDestination();

export async function playMelody(pitchSequence: string[]): Promise<void> {
  const now = Tone.now();
  pitchSequence.forEach((pitch, i) => {
    synth.triggerAttackRelease(`${pitch}4`, '8n', now + i * 0.5);
  });
}
```

---

## State Management

### Svelte Stores (src/lib/stores/)

#### puzzle.ts
```typescript
import { writable } from 'svelte/store';

interface PuzzleState {
  id: number | null;
  layout: PuzzleLayout | null;
  clues: Clue[];
  loading: boolean;
  error: string | null;
}

export const puzzle = writable<PuzzleState>({
  id: null,
  layout: null,
  clues: [],
  loading: false,
  error: null
});

export async function loadPuzzle(id: number) {
  puzzle.update(state => ({ ...state, loading: true }));
  
  try {
    const response = await fetch(`/api/puzzles/${id}`);
    const data = await response.json();
    
    puzzle.set({
      id: data.puzzle.id,
      layout: data.puzzle.layout,
      clues: data.puzzle.layout.result,
      loading: false,
      error: null
    });
  } catch (err) {
    puzzle.update(state => ({ 
      ...state, 
      loading: false, 
      error: 'Failed to load puzzle' 
    }));
  }
}
```

#### userInput.ts
```typescript
import { writable, derived } from 'svelte/store';

type GridCell = string | null; // Note or null
type GridState = GridCell[][];

export const userInput = writable<GridState>([]);
export const activeWord = writable<number | null>(null);

// Initialize empty grid
export function initializeGrid(rows: number, cols: number) {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
  userInput.set(grid);
}

// Set cell value
export function setCellValue(row: number, col: number, value: string | null) {
  userInput.update(grid => {
    grid[row][col] = value;
    return grid;
  });
}

// Derived store: completion status
export const completionStatus = derived(
  [userInput, puzzle],
  ([$userInput, $puzzle]) => {
    if (!$puzzle.layout) return { solved: 0, total: 0 };
    
    let solved = 0;
    const total = $puzzle.clues.length;
    
    // Check each word
    for (const clue of $puzzle.clues) {
      if (isWordCorrect(clue, $userInput)) {
        solved++;
      }
    }
    
    return { solved, total };
  }
);
```

#### audio.ts
```typescript
import { writable } from 'svelte/store';

interface AudioState {
  playing: boolean;
  currentClue: number | null;
  volume: number;
  speed: number;
}

export const audio = writable<AudioState>({
  playing: false,
  currentClue: null,
  volume: 0.7,
  speed: 1.0
});
```

---

## Validation Logic

### src/lib/utils/validation.ts

```typescript
import type { Clue, GridState } from '$lib/types/puzzle';
import { REVERSE_PITCH_MAP } from './pitchMapping';

/**
 * Check if a word (melody) is correctly filled in the grid
 */
export function isWordCorrect(clue: Clue, grid: GridState): boolean {
  const { position, orientation, answer } = clue;
  let { x, y } = position;
  
  for (let i = 0; i < answer.length; i++) {
    const expectedLetter = answer[i];
    const actualValue = grid[y][x];
    
    // Check if cell matches expected letter
    if (actualValue !== expectedLetter) {
      return false;
    }
    
    // Move to next cell
    if (orientation === 'across') {
      x++;
    } else {
      y++;
    }
  }
  
  return true;
}

/**
 * Validate entire grid
 */
export function validateGrid(
  clues: Clue[], 
  grid: GridState
): Map<number, boolean> {
  const results = new Map<number, boolean>();
  
  clues.forEach((clue, index) => {
    results.set(index, isWordCorrect(clue, grid));
  });
  
  return results;
}

/**
 * Convert grid letter back to musical note
 * (Reverse of the pitch mapping)
 */
export function letterToNote(letter: string): string {
  return REVERSE_PITCH_MAP[letter] || letter;
}
```

### src/lib/utils/pitchMapping.ts

```typescript
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
 * Reverse mapping: letter → note
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
 * Get note display name (with sharp symbol)
 */
export function getNoteDisplayName(letter: string): string {
  const note = REVERSE_PITCH_MAP[letter];
  return note.replace('#', '♯'); // Use proper sharp symbol
}
```

---

## Styling Guide

### Design Principles
- **Clean & Minimal:** Focus on the puzzle
- **Music-Themed:** Subtle musical motifs (staff lines, notes)
- **Accessible:** High contrast, WCAG AA compliant
- **Responsive:** Mobile-first design

### Color Palette (Suggested)

```css
:root {
  /* Primary colors */
  --color-bg: #fafafa;
  --color-text: #1a1a1a;
  --color-primary: #4f46e5; /* Indigo */
  --color-secondary: #ec4899; /* Pink */
  
  /* Grid states */
  --color-cell-empty: #ffffff;
  --color-cell-filled: #e0e7ff;
  --color-cell-active: #4f46e5;
  --color-cell-correct: #10b981;
  --color-cell-incorrect: #ef4444;
  
  /* UI elements */
  --color-border: #d1d5db;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1a1a1a;
    --color-text: #fafafa;
    --color-cell-empty: #2a2a2a;
    --color-cell-filled: #3730a3;
  }
}
```

### Grid Styling

```css
.crossword-grid {
  display: grid;
  gap: 2px;
  background: var(--color-border);
  padding: 2px;
  max-width: 600px;
  margin: 0 auto;
}

.crossword-cell {
  aspect-ratio: 1;
  background: var(--color-cell-empty);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.crossword-cell:hover {
  background: var(--color-cell-filled);
}

.crossword-cell.active {
  outline: 3px solid var(--color-cell-active);
  outline-offset: -3px;
}

.crossword-cell.correct {
  background: var(--color-cell-correct);
  color: white;
}

.crossword-cell.incorrect {
  background: var(--color-cell-incorrect);
  color: white;
  animation: shake 0.3s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

### Note Picker Styling

```css
.note-picker {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 4px;
  max-width: 800px;
  margin: 0 auto;
}

.note-button {
  padding: 1rem;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.note-button.sharp {
  background: #1a1a1a;
  color: white;
  transform: translateY(-8px);
}

.note-button:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow);
}

.note-button:active {
  transform: scale(0.95);
}

/* Mobile: Stack vertically */
@media (max-width: 640px) {
  .note-picker {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// tests/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isWordCorrect } from '$lib/utils/validation';

describe('isWordCorrect', () => {
  it('returns true for correct word', () => {
    const clue = {
      answer: 'CDEFG',
      position: { x: 0, y: 0 },
      orientation: 'across'
    };
    const grid = [['C', 'D', 'E', 'F', 'G']];
    
    expect(isWordCorrect(clue, grid)).toBe(true);
  });
  
  it('returns false for incorrect word', () => {
    const clue = {
      answer: 'CDEFG',
      position: { x: 0, y: 0 },
      orientation: 'across'
    };
    const grid = [['C', 'D', 'X', 'F', 'G']];
    
    expect(isWordCorrect(clue, grid)).toBe(false);
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/puzzle.test.ts
import { test, expect } from '@playwright/test';

test('user can solve puzzle', async ({ page }) => {
  await page.goto('/puzzle/1');
  
  // Click first cell
  await page.click('.crossword-cell[data-row="0"][data-col="0"]');
  
  // Select note
  await page.click('.note-button[data-note="C"]');
  
  // Check cell filled
  expect(await page.textContent('.crossword-cell[data-row="0"][data-col="0"]')).toBe('C');
  
  // Play audio
  await page.click('.clue-play-button[data-clue="0"]');
  
  // Should hear audio (hard to test, check UI state)
  expect(await page.isVisible('.audio-playing-indicator')).toBe(true);
});
```

---

## Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

**1. Static Hosting (Adapter Static)**
```bash
npm install -D @sveltejs/adapter-static
```

Configure `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html'
    })
  }
};
```

Deploy to:
- Vercel
- Netlify
- GitHub Pages

**2. Node Server (Adapter Node)**
```bash
npm install -D @sveltejs/adapter-node
```

Deploy to:
- DigitalOcean
- Railway
- Fly.io

**Note:** If using API routes that access database, you need a Node server (not static).

### Environment Variables

```env
# .env
DATABASE_PATH=./music_crossword.db
PUBLIC_APP_URL=https://musical-crossword.app
```

---

## Next Steps

1. **Set up SvelteKit project** (follow Project Setup section)
2. **Create API routes** (implement database queries)
3. **Build CrosswordGrid component** (start with static display)
4. **Add NotePicker** (implement note input)
5. **Integrate audio** (Web Audio API for playback)
6. **Add validation** (check answers, show feedback)
7. **Polish UI** (animations, responsive design)
8. **Test & deploy** (Vitest + Playwright, then deploy)

---

## Additional Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Tone.js Documentation](https://tonejs.github.io/)
- [Svelte REPL (Playground)](https://svelte.dev/repl)

---

**Good luck building! 🎵🎹**

