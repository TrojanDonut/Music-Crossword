# Musical Crossword - Web Application

An interactive web application for solving musical crossword puzzles. Users fill in melodic sequences by recognizing famous melodies instead of answering text clues.

> **📘 For complete documentation, see [../DOCUMENTATION.md](../DOCUMENTATION.md)**

## Features

- 🎵 **Interactive Crossword Grid** - Click cells and fill in musical notes
- 🎹 **12-Note Chromatic Picker** - Select notes from C to B (including sharps)
- 🔊 **Audio Playback with Rhythm** - Listen to melodies with natural timing (not robotic!)
- 🎼 **Rhythm Support** - Melodies play with proper note durations (quarter notes, eighth notes, etc.)
- 🎚️ **Tempo Control** - Adjust playback speed (60-180 BPM) with slider and presets
- 💡 **Hint System** - Play first note, first 3 notes, or full melody (with rhythm!)
- ✓ **Real-time Validation** - Instant feedback on correct/incorrect answers
- 📊 **Progress Tracking** - See your completion status with visual progress bar
- 💾 **Auto-save** - Your progress is automatically saved to localStorage
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⌨️ **Keyboard Shortcuts** - C, D, E, F, G, A, B keys (Shift for sharps)

## Tech Stack

- **SvelteKit 2.0** - Modern meta-framework for Svelte
- **TypeScript** - Type safety
- **Better-SQLite3** - Database access
- **Web Audio API** - Audio synthesis
- **Vite** - Build tool

## Prerequisites

- Node.js 16+ and npm
- Existing `music_crossword.db` database with puzzles

## Installation

```bash
# Install dependencies
npm install

# Link database (or copy it)
ln -s ../music_crossword.db ./music_crossword.db
```

## Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

## Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
music-crossword-ui/
├── src/
│   ├── lib/
│   │   ├── components/         # Svelte components
│   │   │   ├── CrosswordGrid.svelte
│   │   │   ├── CrosswordCell.svelte
│   │   │   ├── NotePicker.svelte
│   │   │   ├── ClueList.svelte
│   │   │   ├── AudioPlayer.svelte
│   │   │   └── ProgressIndicator.svelte
│   │   ├── stores/             # Svelte stores (state management)
│   │   │   ├── puzzle.ts
│   │   │   ├── userInput.ts
│   │   │   └── audio.ts
│   │   ├── utils/              # Utility functions
│   │   │   ├── pitchMapping.ts
│   │   │   ├── audioSynth.ts
│   │   │   ├── validation.ts
│   │   │   └── database.ts
│   │   └── types/              # TypeScript types
│   │       └── puzzle.ts
│   ├── routes/
│   │   ├── +page.svelte        # Home page (puzzle list)
│   │   ├── +layout.svelte      # Root layout
│   │   ├── puzzle/
│   │   │   └── [id]/
│   │   │       └── +page.svelte # Puzzle player page
│   │   └── api/
│   │       └── puzzles/
│   │           ├── +server.ts   # GET /api/puzzles
│   │           └── [id]/
│   │               └── +server.ts # GET /api/puzzles/:id
│   ├── app.html                # HTML template
│   └── app.css                 # Global styles
├── static/                     # Static assets
├── music_crossword.db          # SQLite database (symlink)
└── package.json
```

## How to Play

1. **Select a Puzzle** - Choose from the list of available puzzles on the home page
2. **Listen to Clues** - Click the play button on any clue to hear the melody
3. **Fill in Notes** - Click a cell in the grid, then select a note from the picker
4. **Use Hints** - Click "1st Note" or "3 Notes" buttons for hints
5. **Check Progress** - Watch the progress bar fill up as you solve melodies
6. **Complete Puzzle** - Solve all melodies to complete the puzzle!

## Keyboard Shortcuts

- **C, D, E, F, G, A, B** - Select natural notes
- **Shift + C, D, F, G, A** - Select sharp notes (C#, D#, F#, G#, A#)
- **Backspace / Delete** - Clear current cell
- **Click cells** - Navigate between cells

## Pitch Mapping

The application displays musical notes (C, D♯, E, etc.) to users, but internally uses grid letters for the crossword algorithm:

| Musical Note | Display | Grid Letter (Internal) |
|--------------|---------|------------------------|
| C            | C       | C                      |
| C♯           | C♯      | D                      |
| D            | D       | E                      |
| D♯           | D♯      | F                      |
| E            | E       | G                      |
| F            | F       | H                      |
| F♯           | F♯      | I                      |
| G            | G       | J                      |
| G♯           | G♯      | K                      |
| A            | A       | L                      |
| A♯           | A♯      | M                      |
| B            | B       | N                      |

## API Endpoints

### GET /api/puzzles
List all available puzzles

**Response:**
```json
{
  "success": true,
  "puzzles": [...],
  "count": 10
}
```

### GET /api/puzzles/:id
Get specific puzzle with full details and motif data

**Response:**
```json
{
  "success": true,
  "puzzle": {
    "id": 1,
    "layout": {...},
    "motif_ids": [...],
    "difficulty": 1,
    "created_at": "2024-11-24T..."
  }
}
```

## Audio System

The application uses the Web Audio API to synthesize notes in real-time:

- **Triangle waves** for a softer, more musical sound
- **ADSR envelope** (Attack, Decay, Sustain, Release) for realistic notes
- **Standard tuning** with A4 = 440Hz
- **Rhythm Support** - Proper note durations (whole, half, quarter, eighth notes, etc.)
- **Adjustable tempo** - 60-180 BPM with presets (Slow, Normal, Fast)
- **Kern Notation** - Supports standard rhythm notation including dotted notes

### Rhythm Feature ⭐ NEW

Melodies now sound **natural and recognizable** instead of robotic!

**Example - Beethoven's 5th Symphony:**
```
Without rhythm: G━━ G━━ G━━ Eb━━  (all equal - boring)
With rhythm:    G━ G━ G━ Eb━━━━━  (short-short-short-LONG!)
                8  8  8  2
```

**Tempo Presets:**
- **Slow (80 BPM)**: Learning mode - easier to recognize
- **Normal (120 BPM)**: Standard playback
- **Fast (160 BPM)**: Challenge mode - test your skills!

See **[RHYTHM_INTEGRATION.md](RHYTHM_INTEGRATION.md)** for technical details.

## State Management

The application uses Svelte stores for reactive state management:

- **puzzleStore** - Current puzzle data
- **userInput** - Grid state with user answers
- **audioStore** - Audio playback state
- **validation** - Derived validation results
- **completionStatus** - Derived completion statistics

## Progressive Enhancement

- Works without JavaScript (shows static puzzle)
- Audio features degrade gracefully if Web Audio API unavailable
- Responsive design adapts to all screen sizes
- Touch-optimized for mobile devices

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Troubleshooting

### Database not found
Make sure `music_crossword.db` exists in the project root. Create a symlink:
```bash
ln -s ../music_crossword.db ./music_crossword.db
```

### No puzzles available
Generate puzzles using the crossword generator:
```bash
cd ..
node crossword_generator.js
```

### Audio not playing
- Check browser autoplay policies (user interaction required)
- Ensure Web Audio API is supported in your browser
- Check browser console for errors

### Build errors
- Ensure Node.js version is 16 or higher
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run check`

## Documentation

For detailed information, see:
- **[Complete Documentation](../DOCUMENTATION.md)** - Comprehensive guide
- **[Changelog](CHANGELOG.md)** - Version history
- **[Project Plan](../projektni_plan.md)** - Original plan (Slovenian)

---

**Made with ♪ for music lovers**
